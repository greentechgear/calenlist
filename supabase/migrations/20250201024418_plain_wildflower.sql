/*
  # Add Calendar Stats Table

  1. New Tables
    - calendar_stats: Materialized stats for calendars
      - calendar_id (uuid, references calendars)
      - subscriber_count (integer)
      - updated_at (timestamptz)

  2. Triggers
    - Automatically update stats when subscriptions change
    - Keep stats in sync with calendar deletions

  3. Security
    - RLS enabled with public read access
    - Only system can modify stats
*/

-- Create calendar stats table
CREATE TABLE calendar_stats (
  calendar_id uuid PRIMARY KEY REFERENCES calendars(id) ON DELETE CASCADE,
  subscriber_count integer DEFAULT 0 NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE calendar_stats ENABLE ROW LEVEL SECURITY;

-- Create function to update stats
CREATE OR REPLACE FUNCTION update_calendar_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert stats
  INSERT INTO calendar_stats (calendar_id, subscriber_count)
  SELECT 
    calendar_id,
    COUNT(*)::integer as subscriber_count
  FROM subscriptions
  WHERE calendar_id = COALESCE(NEW.calendar_id, OLD.calendar_id)
  GROUP BY calendar_id
  ON CONFLICT (calendar_id) 
  DO UPDATE SET 
    subscriber_count = EXCLUDED.subscriber_count,
    updated_at = now();

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for subscription changes
CREATE TRIGGER update_stats_on_subscription_change
  AFTER INSERT OR DELETE OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_stats();

-- Create function to initialize stats for new calendars
CREATE OR REPLACE FUNCTION initialize_calendar_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO calendar_stats (calendar_id, subscriber_count)
  VALUES (NEW.id, 0)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new calendars
CREATE TRIGGER initialize_stats_on_calendar_create
  AFTER INSERT ON calendars
  FOR EACH ROW
  EXECUTE FUNCTION initialize_calendar_stats();

-- Add RLS policies
CREATE POLICY "calendar_stats_read_policy"
  ON calendar_stats FOR SELECT
  TO public
  USING (true);

-- Initialize stats for existing calendars
INSERT INTO calendar_stats (calendar_id, subscriber_count)
SELECT 
  c.id as calendar_id,
  COALESCE(
    (SELECT COUNT(*)::integer 
     FROM subscriptions s 
     WHERE s.calendar_id = c.id
    ), 
    0
  ) as subscriber_count
FROM calendars c
ON CONFLICT DO NOTHING;

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');