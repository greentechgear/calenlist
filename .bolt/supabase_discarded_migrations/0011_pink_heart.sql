/*
  # Add calendar statistics
  
  1. Creates a materialized view for calendar statistics
  2. Creates a function to refresh the statistics
  3. Creates a trigger to automatically refresh statistics
*/

-- Create materialized view for calendar statistics
CREATE MATERIALIZED VIEW calendar_stats AS
SELECT 
  c.id as calendar_id,
  COUNT(DISTINCT s.user_id) as subscriber_count
FROM calendars c
LEFT JOIN subscriptions s ON s.calendar_id = c.id
GROUP BY c.id;

-- Create index for better performance
CREATE INDEX calendar_stats_calendar_id_idx ON calendar_stats(calendar_id);

-- Create function to refresh calendar stats
CREATE OR REPLACE FUNCTION refresh_calendar_stats()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW calendar_stats;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh stats when subscriptions change
CREATE TRIGGER refresh_calendar_stats_on_subscription
AFTER INSERT OR DELETE OR UPDATE ON subscriptions
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_calendar_stats();

-- Create function to get calendar with stats
CREATE OR REPLACE FUNCTION get_calendar_with_stats(calendar_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  google_calendar_url text,
  streaming_urls jsonb,
  is_public boolean,
  banner jsonb,
  created_at timestamptz,
  subscriber_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    c.name,
    c.google_calendar_url,
    c.streaming_urls,
    c.is_public,
    c.banner,
    c.created_at,
    COALESCE(cs.subscriber_count, 0)::bigint
  FROM calendars c
  LEFT JOIN calendar_stats cs ON cs.calendar_id = c.id
  WHERE c.id = calendar_id;
END;
$$ LANGUAGE plpgsql;