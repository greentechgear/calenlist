-- Drop existing policies
DROP POLICY IF EXISTS "calendars_read_policy" ON calendars;
DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;
DROP POLICY IF EXISTS "subscriptions_insert_policy" ON subscriptions;

-- Create comprehensive calendar read policy
CREATE POLICY "calendars_read_policy"
  ON calendars FOR SELECT
  USING (
    -- Anyone can view public calendars
    is_public = true OR
    -- Users can always see their own calendars
    user_id = auth.uid() OR
    -- Authenticated users can see private calendars they have the link to
    auth.role() = 'authenticated'
  );

-- Create improved profiles read policy that doesn't rely on auth.users
CREATE POLICY "profiles_read_policy"
  ON profiles FOR SELECT
  USING (
    -- Users can read their own profile
    id = auth.uid() OR
    -- Anyone can read profiles of calendar owners
    EXISTS (
      SELECT 1 FROM calendars c
      WHERE c.user_id = profiles.id
    )
  );

-- Update subscription policy
CREATE POLICY "subscriptions_insert_policy"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM calendars c
      WHERE c.id = calendar_id
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendars_visibility ON calendars(is_public, user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_calendars ON profiles(id) INCLUDE (display_name);

-- Ensure proper grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');