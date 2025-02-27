-- Drop existing read policy
DROP POLICY IF EXISTS "calendars_read_policy" ON calendars;

-- Create updated read policy that properly handles single row selection
CREATE POLICY "calendars_read_policy"
  ON calendars FOR SELECT
  USING (
    -- Allow if calendar is public
    is_public = true OR
    -- Allow if user owns the calendar 
    user_id = auth.uid() OR
    -- Allow if user is authenticated and has the calendar ID
    (
      auth.role() = 'authenticated' AND
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid()
      )
    )
  );

-- Create index to improve performance
CREATE INDEX IF NOT EXISTS idx_calendars_public_user ON calendars(is_public, user_id);

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');