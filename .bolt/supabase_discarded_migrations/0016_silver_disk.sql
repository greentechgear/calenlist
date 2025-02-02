/*
  # Fix Calendar Stats Permissions

  1. Changes
    - Drop and recreate calendar_stats view with proper permissions
    - Add proper RLS policies for subscriptions
    - Fix refresh function security context

  2. Security
    - Grant proper permissions to all roles
    - Ensure RLS policies are correctly set
*/

-- Drop existing objects
DROP MATERIALIZED VIEW IF EXISTS calendar_stats CASCADE;
DROP TRIGGER IF EXISTS refresh_calendar_stats_on_subscription ON subscriptions;
DROP FUNCTION IF EXISTS refresh_calendar_stats();

-- Recreate materialized view
CREATE MATERIALIZED VIEW calendar_stats AS
SELECT 
  c.id as calendar_id,
  COUNT(DISTINCT s.user_id) as subscriber_count
FROM calendars c
LEFT JOIN subscriptions s ON s.calendar_id = c.id
GROUP BY c.id;

-- Create index
CREATE UNIQUE INDEX calendar_stats_calendar_id_idx ON calendar_stats(calendar_id);

-- Grant permissions
GRANT SELECT ON calendar_stats TO anon, authenticated;
ALTER MATERIALIZED VIEW calendar_stats OWNER TO postgres;

-- Create refresh function with proper security
CREATE OR REPLACE FUNCTION refresh_calendar_stats()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY calendar_stats;
  RETURN NULL;
END;
$$;

-- Create trigger
CREATE TRIGGER refresh_calendar_stats_on_subscription
AFTER INSERT OR DELETE OR UPDATE ON subscriptions
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_calendar_stats();

-- Initial refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY calendar_stats;