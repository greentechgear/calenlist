-- Drop existing policies
DROP POLICY IF EXISTS "calendars_read_policy" ON calendars;
DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;

-- Create open calendar read policy
CREATE POLICY "calendars_read_policy"
  ON calendars FOR SELECT
  USING (true);  -- Allow anyone to read any calendar

-- Create open profiles read policy for calendar owners
CREATE POLICY "profiles_read_policy"
  ON profiles FOR SELECT
  USING (
    -- Anyone can read profiles of calendar owners
    EXISTS (
      SELECT 1 FROM calendars c
      WHERE c.user_id = profiles.id
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendars_user ON calendars(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Ensure proper grants for anonymous access
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON calendars TO anon;
GRANT SELECT ON profiles TO anon;

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');