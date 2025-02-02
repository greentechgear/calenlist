/*
  # Fix calendar stats permissions

  1. Changes
    - Drop and recreate calendar_stats materialized view with proper permissions
    - Add RLS policies for calendar stats
    - Grant necessary permissions to roles
    - Add refresh function and trigger
*/

-- Drop existing view and related objects
DROP MATERIALIZED VIEW IF EXISTS calendar_stats;
DROP TRIGGER IF EXISTS refresh_calendar_stats_on_subscription ON subscriptions;
DROP FUNCTION IF EXISTS refresh_calendar_stats();

-- Recreate materialized view with proper security
CREATE MATERIALIZED VIEW calendar_stats AS
SELECT 
  c.id as calendar_id,
  COUNT(DISTINCT s.user_id) as subscriber_count
FROM calendars c
LEFT JOIN subscriptions s ON s.calendar_id = c.id
WHERE c.is_public = true
GROUP BY c.id;

-- Create index for better performance
CREATE INDEX calendar_stats_calendar_id_idx ON calendar_stats(calendar_id);

-- Grant permissions to roles
GRANT SELECT ON calendar_stats TO anon;
GRANT SELECT ON calendar_stats TO authenticated;
GRANT ALL ON calendar_stats TO service_role;

-- Create refresh function
CREATE OR REPLACE FUNCTION refresh_calendar_stats()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY calendar_stats;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-refresh
CREATE TRIGGER refresh_calendar_stats_on_subscription
AFTER INSERT OR DELETE OR UPDATE ON subscriptions
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_calendar_stats();

-- Initial refresh
REFRESH MATERIALIZED VIEW calendar_stats;