-- Drop existing policies
DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Create comprehensive profile policies
CREATE POLICY "profiles_read_policy" ON profiles
  FOR SELECT
  USING (
    -- Users can read their own profile
    id = auth.uid() OR
    -- Anyone can read profiles of calendar owners
    EXISTS (
      SELECT 1 FROM calendars c
      WHERE c.user_id = profiles.id
    )
  );

-- Allow authenticated users to create their own profile
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT
  WITH CHECK (
    -- Users can only create their own profile
    id = auth.uid()
  );

-- Allow users to update their own profile
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Create function to handle new user signup with proper permissions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  display_name_val text;
BEGIN
  -- Get display name with validation
  display_name_val := COALESCE(
    NULLIF(TRIM((NEW.raw_user_meta_data->>'display_name')::text), ''),
    CASE 
      WHEN NEW.email IS NOT NULL AND NEW.email != '' 
      THEN split_part(NEW.email, '@', 1)
      ELSE 'User ' || substr(NEW.id::text, 1, 8)
    END
  );

  -- Create profile directly (bypassing RLS since this is SECURITY DEFINER)
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, 'pending@example.com'),
    display_name_val
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    updated_at = now();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail
  RAISE WARNING 'Error creating profile: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Recreate trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure proper grants
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');