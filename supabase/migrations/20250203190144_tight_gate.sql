-- Drop existing read policy
DROP POLICY IF EXISTS "calendars_read_policy" ON calendars;

-- Create simplified but secure read policy
CREATE POLICY "calendars_read_policy"
  ON calendars FOR SELECT
  USING (
    -- Public calendars are visible to everyone
    is_public = true OR
    -- Users can always see their own calendars
    user_id = auth.uid() OR
    -- Authenticated users can see calendars they're subscribed to
    (
      auth.role() = 'authenticated' AND
      EXISTS (
        SELECT 1 FROM subscriptions
        WHERE calendar_id = calendars.id
        AND user_id = auth.uid()
      )
    )
  );

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');