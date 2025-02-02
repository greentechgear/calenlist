-- Drop existing policies
DROP POLICY IF EXISTS "event_feedback_insert_policy" ON event_feedback;
DROP POLICY IF EXISTS "event_feedback_select_policy" ON event_feedback;

-- Create new policies with proper permissions
CREATE POLICY "event_feedback_insert_policy"
  ON event_feedback
  FOR INSERT
  WITH CHECK (
    -- User must be authenticated and subscribed to the calendar
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE calendar_id = event_feedback.calendar_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "event_feedback_update_policy"
  ON event_feedback
  FOR UPDATE
  USING (
    -- Users can only update their own feedback
    auth.uid() = user_id
  )
  WITH CHECK (
    -- Must still be subscribed to update
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE calendar_id = event_feedback.calendar_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "event_feedback_select_policy"
  ON event_feedback
  FOR SELECT
  USING (
    -- Users can see their own feedback or feedback for calendars they own
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM calendars
      WHERE id = event_feedback.calendar_id
      AND user_id = auth.uid()
    )
  );

-- Ensure RLS is enabled
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON event_feedback TO authenticated;