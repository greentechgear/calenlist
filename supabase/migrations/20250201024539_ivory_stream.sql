/*
  # Fix RLS Policies and Auth Issues

  1. Changes
    - Simplify RLS policies to prevent recursion
    - Fix profile handling for auth
    - Add profile trigger for new users
    - Update calendar and subscription policies

  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
    - Handle auth edge cases
*/

-- Create profile handler for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'display_name')::text,
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Simplify calendar access check
CREATE OR REPLACE FUNCTION can_access_calendar(calendar_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if calendar exists and is accessible
  RETURN EXISTS (
    SELECT 1 FROM calendars c
    WHERE c.id = calendar_id
    AND (
      c.is_public = true OR 
      c.user_id = auth.uid()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update calendar policies
DROP POLICY IF EXISTS "calendars_read_policy" ON calendars;
CREATE POLICY "calendars_read_policy"
  ON calendars FOR SELECT
  USING (
    is_public = true OR 
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.calendar_id = id
      AND s.user_id = auth.uid()
    )
  );

-- Update subscription policies
DROP POLICY IF EXISTS "subscriptions_read_policy" ON subscriptions;
CREATE POLICY "subscriptions_read_policy"
  ON subscriptions FOR SELECT
  USING (
    user_id = auth.uid() OR
    calendar_id IN (
      SELECT id FROM calendars WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "subscriptions_insert_policy" ON subscriptions;
CREATE POLICY "subscriptions_insert_policy"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM calendars c
      WHERE c.id = calendar_id
      AND (c.is_public = true OR c.user_id = auth.uid())
    )
  );

-- Update profile policies
DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;
CREATE POLICY "profiles_read_policy"
  ON profiles FOR SELECT
  USING (
    id = auth.uid() OR
    id IN (
      SELECT user_id FROM calendars WHERE is_public = true
    )
  );

-- Ensure proper grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');