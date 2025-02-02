-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS ensure_profile_exists() CASCADE;

-- Create improved profile handler with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  profile_id uuid;
  display_name_val text;
  retry_count integer := 0;
  max_retries constant integer := 3;
BEGIN
  -- Early return if profile exists
  SELECT id INTO profile_id FROM profiles WHERE id = NEW.id;
  IF FOUND THEN
    RETURN NEW;
  END IF;

  -- Get display name with fallbacks
  display_name_val := COALESCE(
    NULLIF(TRIM((NEW.raw_user_meta_data->>'display_name')::text), ''),
    CASE 
      WHEN NEW.email IS NOT NULL AND NEW.email != '' 
      THEN split_part(NEW.email, '@', 1)
      ELSE 'User ' || substr(NEW.id::text, 1, 8)
    END
  );

  -- Profile creation with retries
  LOOP
    BEGIN
      INSERT INTO profiles (id, email, display_name)
      VALUES (
        NEW.id,
        COALESCE(NULLIF(TRIM(NEW.email), ''), 'pending@example.com'),
        display_name_val
      )
      ON CONFLICT (id) DO UPDATE 
      SET 
        email = EXCLUDED.email,
        display_name = EXCLUDED.display_name,
        updated_at = now()
      RETURNING id INTO profile_id;

      IF profile_id IS NOT NULL THEN
        RETURN NEW;
      END IF;

      retry_count := retry_count + 1;
      EXIT WHEN retry_count >= max_retries;
      
      -- Exponential backoff
      PERFORM pg_sleep(power(2, retry_count - 1) * 0.1);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Profile creation attempt % failed: %', retry_count, SQLERRM;
      
      retry_count := retry_count + 1;
      EXIT WHEN retry_count >= max_retries;
      
      -- Exponential backoff
      PERFORM pg_sleep(power(2, retry_count - 1) * 0.1);
    END;
  END LOOP;

  -- Always return NEW to prevent auth failures
  RETURN NEW;
END;
$$;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Update RLS policies
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_service_insert_policy" ON profiles;

-- Read policy
CREATE POLICY "profiles_read_policy" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR  -- Own profile
    EXISTS (  -- Public calendar owner
      SELECT 1 FROM calendars c
      WHERE c.user_id = profiles.id
      AND c.is_public = true
    )
  );

-- Insert policy for authenticated users
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = id
  );

-- Insert policy for service role
CREATE POLICY "profiles_service_role_insert_policy" ON profiles
  FOR INSERT 
  TO service_role
  WITH CHECK (true);

-- Update policy
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure proper grants
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');