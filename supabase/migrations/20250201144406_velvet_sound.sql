-- Drop existing policies if they exist
DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Update profiles RLS policies
CREATE POLICY "profiles_read_policy"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- Users can read their own profile
    id = auth.uid() OR
    -- Users can read profiles of public calendar owners
    EXISTS (
      SELECT 1 FROM calendars c
      WHERE c.user_id = profiles.id
      AND c.is_public = true
    )
  );

CREATE POLICY "profiles_insert_policy"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Users can only create their own profile
    id = auth.uid()
  );

-- Also allow service role to create profiles
CREATE POLICY "profiles_service_insert_policy"
  ON profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "profiles_update_policy"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Create function to ensure profile exists
CREATE OR REPLACE FUNCTION ensure_profile_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to create profile if it doesn't exist
  INSERT INTO profiles (id, email, display_name)
  SELECT 
    auth.uid(),
    COALESCE(auth.jwt()->>'email', ''),
    COALESCE(
      (auth.jwt()->'user_metadata'->>'display_name')::text,
      CASE 
        WHEN auth.jwt()->>'email' IS NOT NULL THEN split_part(auth.jwt()->>'email', '@', 1)
        ELSE 'User ' || substr(auth.uid()::text, 1, 8)
      END
    )
  WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create profile handler for new users with retries
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  display_name_val text;
  retry_count integer := 0;
  max_retries constant integer := 3;
BEGIN
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Get display name from metadata or email
  display_name_val := COALESCE(
    (NEW.raw_user_meta_data->>'display_name')::text,
    CASE 
      WHEN NEW.email IS NOT NULL THEN split_part(NEW.email, '@', 1)
      ELSE 'User ' || substr(NEW.id::text, 1, 8)
    END
  );

  -- Try to create profile with retries
  WHILE retry_count < max_retries LOOP
    BEGIN
      INSERT INTO profiles (id, email, display_name)
      VALUES (NEW.id, NEW.email, display_name_val)
      ON CONFLICT (id) DO NOTHING
      RETURNING id INTO NEW.id;

      -- If insert was successful or profile now exists, return
      IF NEW.id IS NOT NULL OR EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
        RETURN NEW;
      END IF;

      retry_count := retry_count + 1;
      IF retry_count < max_retries THEN
        PERFORM pg_sleep(0.1 * retry_count); -- Exponential backoff
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue retrying
      RAISE WARNING 'Profile creation attempt % failed: %', retry_count, SQLERRM;
      
      IF retry_count = max_retries - 1 THEN
        RAISE WARNING 'Failed to create profile after % attempts', max_retries;
      END IF;
      
      retry_count := retry_count + 1;
      IF retry_count < max_retries THEN
        PERFORM pg_sleep(0.1 * retry_count);
      END IF;
    END;
  END LOOP;

  -- Return NEW even if profile creation failed to prevent auth failure
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Add trigger to ensure profile exists before calendar operations
DROP TRIGGER IF EXISTS ensure_profile_before_calendar ON calendars;
CREATE TRIGGER ensure_profile_before_calendar
  BEFORE INSERT ON calendars
  FOR EACH ROW
  EXECUTE FUNCTION ensure_profile_exists();

-- Add trigger to ensure profile exists before subscription operations
DROP TRIGGER IF EXISTS ensure_profile_before_subscription ON subscriptions;
CREATE TRIGGER ensure_profile_before_subscription
  BEFORE INSERT ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION ensure_profile_exists();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');