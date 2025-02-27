-- Drop existing subscription policies
DROP POLICY IF EXISTS "subscriptions_insert_policy" ON subscriptions;

-- Create updated subscription policy that only requires authentication
CREATE POLICY "subscriptions_insert_policy"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Only require authentication, not email verification
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM calendars c
      WHERE c.id = calendar_id
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_calendar 
  ON subscriptions(user_id, calendar_id);

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');