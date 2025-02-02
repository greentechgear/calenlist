/*
  # Fix calendar statistics permissions

  1. Create materialized view for calendar statistics
  2. Grant necessary permissions
  3. Create policies for public access
*/

-- First create the materialized view if it doesn't exist
CREATE MATERIALIZED VIEW IF NOT EXISTS calendar_stats AS
SELECT 
  c.id as calendar_id,
  COUNT(DISTINCT s.user_id) as subscriber_count
FROM calendars c
LEFT JOIN subscriptions s ON s.calendar_id = c.id
GROUP BY c.id;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS calendar_stats_calendar_id_idx ON calendar_stats(calendar_id);

-- Grant necessary permissions
GRANT SELECT ON calendar_stats TO anon, authenticated;

-- Refresh the view with current data
REFRESH MATERIALIZED VIEW calendar_stats;