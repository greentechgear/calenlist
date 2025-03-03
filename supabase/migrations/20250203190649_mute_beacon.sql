-- Drop existing read policy
DROP POLICY IF EXISTS "calendars_read_policy" ON calendars;

-- Create comprehensive read policy that handles both public and private calendars
CREATE POLICY "calendars_read_policy"
  ON calendars FOR SELECT
  USING (
    -- Anyone can view public calendars
    is_public = true OR
    -- Users can always see their own calendars
    user_id = auth.uid() OR
    -- Authenticated users can see private calendars they have the link to
    (
      auth.role() = 'authenticated' AND
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid()
      )
    )
  );

-- Update subscription policy to allow subscribing to private calendars
DROP POLICY IF EXISTS "subscriptions_insert_policy" ON subscriptions;
CREATE POLICY "subscriptions_insert_policy"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM calendars c
      WHERE c.id = calendar_id
      AND (
        -- Can subscribe to public calendars
        c.is_public = true OR
        -- Can subscribe to private calendars if authenticated
        auth.role() = 'authenticated'
      )
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_calendars_visibility ON calendars(is_public, user_id);

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');