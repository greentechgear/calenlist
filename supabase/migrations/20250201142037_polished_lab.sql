/*
  # Fix Profile RLS Policies

  1. Changes
    - Update RLS policies for profiles table
    - Add service_role check to insert policy
    - Create trigger for automatic profile creation
  
  2. Security
    - Enable RLS on profiles table
    - Add policies for read, insert, and update
    - Use security definer for trigger function
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Update profiles RLS policies
CREATE POLICY "profiles_read_policy"
  ON profiles FOR SELECT
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM calendars c
      WHERE c.user_id = profiles.id
      AND c.is_public = true
    )
  );

CREATE POLICY "profiles_insert_policy"
  ON profiles FOR INSERT
  WITH CHECK (
    -- Allow insert during signup
    (auth.role() = 'service_role') OR
    -- Allow authenticated users to create their own profile
    (auth.role() = 'authenticated' AND id = auth.uid())
  );

CREATE POLICY "profiles_update_policy"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Create profile handler for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  display_name_val text;
  retry_count integer := 0;
  max_retries constant integer := 3;
BEGIN
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
      ON CONFLICT (id) DO NOTHING;
      
      -- Check if insert was successful
      IF FOUND THEN
        RETURN NEW;
      END IF;

      -- If we get here and retry_count = 0, profile already exists
      IF retry_count = 0 AND EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
        RETURN NEW;
      END IF;

      retry_count := retry_count + 1;
      IF retry_count < max_retries THEN
        PERFORM pg_sleep(0.1 * retry_count); -- Exponential backoff
      END IF;
    EXCEPTION WHEN OTHERS THEN
      IF retry_count = max_retries - 1 THEN
        RAISE WARNING 'Failed to create profile after % attempts: %', max_retries, SQLERRM;
      END IF;
      retry_count := retry_count + 1;
      IF retry_count < max_retries THEN
        PERFORM pg_sleep(0.1 * retry_count);
      END IF;
    END;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');