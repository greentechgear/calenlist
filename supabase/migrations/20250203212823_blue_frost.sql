-- Drop existing policies
DROP POLICY IF EXISTS "subscriptions_read_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete_policy" ON subscriptions;
DROP POLICY IF EXISTS "calendars_read_policy" ON calendars;

-- Create open calendar read policy
CREATE POLICY "calendars_read_policy"
  ON calendars FOR SELECT
  USING (true);  -- Allow anyone to read any calendar

-- Create comprehensive subscription policies
CREATE POLICY "subscriptions_read_policy"
  ON subscriptions FOR SELECT
  TO public
  USING (
    -- Users can read their own subscriptions
    user_id = auth.uid() OR
    -- Calendar owners can see who's subscribed
    EXISTS (
      SELECT 1 FROM calendars c
      WHERE c.id = calendar_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "subscriptions_insert_policy"
  ON subscriptions FOR INSERT
  TO public
  WITH CHECK (
    -- Only require user_id match
    user_id = auth.uid()
  );

CREATE POLICY "subscriptions_delete_policy"
  ON subscriptions FOR DELETE
  TO public
  USING (user_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;

-- Grant proper permissions to both authenticated and anonymous users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON calendars TO anon, authenticated;
GRANT ALL ON subscriptions TO anon, authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_calendar 
  ON subscriptions(user_id, calendar_id);
CREATE INDEX IF NOT EXISTS idx_calendars_user 
  ON calendars(user_id);

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');