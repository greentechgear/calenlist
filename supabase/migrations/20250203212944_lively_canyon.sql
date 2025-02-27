-- Drop existing policies
DROP POLICY IF EXISTS "subscriptions_read_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete_policy" ON subscriptions;
DROP POLICY IF EXISTS "calendars_read_policy" ON calendars;

-- Create simplified calendar read policy
CREATE POLICY "calendars_read_policy"
  ON calendars FOR SELECT
  USING (true);  -- Allow anyone to read any calendar

-- Create simplified subscription policies
CREATE POLICY "subscriptions_read_policy"
  ON subscriptions FOR SELECT
  USING (
    auth.role() IN ('authenticated', 'anon') AND
    (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM calendars c
        WHERE c.id = calendar_id
        AND c.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "subscriptions_insert_policy"
  ON subscriptions FOR INSERT
  WITH CHECK (
    auth.role() IN ('authenticated', 'anon') AND
    user_id = auth.uid()
  );

CREATE POLICY "subscriptions_delete_policy"
  ON subscriptions FOR DELETE
  USING (
    auth.role() IN ('authenticated', 'anon') AND
    user_id = auth.uid()
  );

-- Ensure RLS is enabled but with proper defaults
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;

-- Grant base permissions to all roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON subscriptions TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_calendar 
  ON subscriptions(user_id, calendar_id);
CREATE INDEX IF NOT EXISTS idx_calendars_user 
  ON calendars(user_id);

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');