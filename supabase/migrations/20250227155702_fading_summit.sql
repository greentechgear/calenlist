-- Drop existing calendar_stats read policy if it exists
DROP POLICY IF EXISTS "calendar_stats_read_policy" ON calendar_stats;

-- Create a policy to allow anyone to read calendar stats
CREATE POLICY "calendar_stats_read_policy"
  ON calendar_stats FOR SELECT
  TO public
  USING (true);  -- Allow anyone to read any calendar stats

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_stats_calendar_id 
  ON calendar_stats(calendar_id);

-- Ensure proper grants
GRANT SELECT ON calendar_stats TO anon, authenticated;

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');