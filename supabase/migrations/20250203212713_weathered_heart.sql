-- Drop existing subscription policies
DROP POLICY IF EXISTS "subscriptions_read_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete_policy" ON subscriptions;

-- Create comprehensive subscription policies
CREATE POLICY "subscriptions_read_policy"
  ON subscriptions FOR SELECT
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
  TO authenticated
  WITH CHECK (
    -- Only require authentication, not email verification
    user_id = auth.uid()
  );

CREATE POLICY "subscriptions_delete_policy"
  ON subscriptions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Grant proper permissions
GRANT ALL ON subscriptions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_calendar 
  ON subscriptions(user_id, calendar_id);

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');