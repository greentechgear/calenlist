-- Drop existing policies
DROP POLICY IF EXISTS "subscriptions_read_policy" ON subscriptions;
DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;

-- Update subscription policies to allow calendar owners to see subscriber details
CREATE POLICY "subscriptions_read_policy" ON subscriptions
  FOR SELECT
  USING (
    -- Users can read their own subscriptions
    user_id = auth.uid() OR
    -- Calendar owners can see who's subscribed to their calendars
    EXISTS (
      SELECT 1 FROM calendars c
      WHERE c.id = calendar_id
      AND c.user_id = auth.uid()
    )
  );

-- Update profiles read policy to allow calendar owners to see subscriber profiles
CREATE POLICY "profiles_read_policy" ON profiles
  FOR SELECT
  USING (
    -- Users can read their own profile
    id = auth.uid() OR
    -- Calendar owners can read profiles of their subscribers
    EXISTS (
      SELECT 1 FROM subscriptions s
      JOIN calendars c ON s.calendar_id = c.id
      WHERE s.user_id = profiles.id
      AND c.user_id = auth.uid()
    ) OR
    -- Anyone can read profiles of public calendar owners
    EXISTS (
      SELECT 1 FROM calendars c
      WHERE c.user_id = profiles.id
      AND c.is_public = true
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_calendar_user 
  ON subscriptions(calendar_id, user_id);

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');