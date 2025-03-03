-- Drop existing event feedback policies
DROP POLICY IF EXISTS "event_feedback_read_policy" ON event_feedback;
DROP POLICY IF EXISTS "event_feedback_insert_policy" ON event_feedback;
DROP POLICY IF EXISTS "event_feedback_update_policy" ON event_feedback;
DROP POLICY IF EXISTS "event_feedback_delete_policy" ON event_feedback;

-- Create comprehensive event feedback policies
CREATE POLICY "event_feedback_read_policy"
  ON event_feedback FOR SELECT
  USING (
    -- Users can read their own feedback
    user_id = auth.uid() OR
    -- Calendar owners can see feedback for their calendars
    EXISTS (
      SELECT 1 FROM calendars c
      WHERE c.id = calendar_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "event_feedback_insert_policy"
  ON event_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Must be authenticated and submitting their own feedback
    user_id = auth.uid() AND
    -- Must have access to the calendar (public or subscribed)
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.calendar_id = calendar_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "event_feedback_update_policy"
  ON event_feedback FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "event_feedback_delete_policy"
  ON event_feedback FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_event_feedback_calendar_user 
  ON event_feedback(calendar_id, user_id);

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');