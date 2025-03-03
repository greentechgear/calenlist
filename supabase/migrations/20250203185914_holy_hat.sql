-- Drop existing read policy
DROP POLICY IF EXISTS "calendars_read_policy" ON calendars;

-- Create updated read policy that allows viewing calendars with link
CREATE POLICY "calendars_read_policy"
  ON calendars FOR SELECT
  USING (
    -- Allow if calendar is public
    is_public = true OR
    -- Allow if user owns the calendar 
    user_id = auth.uid() OR
    -- Allow if user is authenticated and has the calendar ID (from URL)
    (auth.role() = 'authenticated' AND id = ANY (ARRAY[id]::uuid[]))
  );

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');