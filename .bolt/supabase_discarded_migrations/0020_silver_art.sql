/*
  # Fix event feedback permissions

  1. Changes
    - Drop and recreate policies for event feedback
    - Ensure subscribers can submit feedback
    - Allow proper feedback visibility
  
  2. Security
    - Only subscribers can submit feedback
    - Calendar owners and feedback authors can view feedback
*/

-- Drop all existing policies for event_feedback
DROP POLICY IF EXISTS "Users can create feedback for events they've attended" ON event_feedback;
DROP POLICY IF EXISTS "Users can view their own feedback" ON event_feedback;
DROP POLICY IF EXISTS "Calendar owners can view feedback for their calendars" ON event_feedback;
DROP POLICY IF EXISTS "Subscribers can submit feedback" ON event_feedback;

-- Create new policies
CREATE POLICY "event_feedback_insert_policy"
  ON event_feedback
  FOR INSERT
  WITH CHECK (
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
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM calendars
      WHERE id = event_feedback.calendar_id
      AND user_id = auth.uid()
    )
  );