/*
  # Add Event Feedback System

  1. New Tables
    - `event_feedback`
      - `id` (uuid, primary key)
      - `calendar_id` (uuid, references calendars)
      - `event_id` (text, from Google Calendar)
      - `user_id` (uuid, references profiles)
      - `rating` (integer, 1-10)
      - `comment` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for feedback management
*/

-- Create event feedback table
CREATE TABLE event_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id uuid REFERENCES calendars(id) ON DELETE CASCADE NOT NULL,
  event_id text NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 10),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can create feedback for events they've attended"
  ON event_feedback
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE calendar_id = event_feedback.calendar_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own feedback"
  ON event_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Calendar owners can view feedback for their calendars"
  ON event_feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calendars
      WHERE id = event_feedback.calendar_id
      AND user_id = auth.uid()
    )
  );