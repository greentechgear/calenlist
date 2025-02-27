-- Drop existing policies
DROP POLICY IF EXISTS "calendar_invites_insert_policy" ON calendar_invites;
DROP POLICY IF EXISTS "calendar_invites_read_policy" ON calendar_invites;

-- Create new insert policy without recursion
CREATE POLICY "calendar_invites_insert_policy" ON calendar_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Calendar owner can send invites
    EXISTS (
      SELECT 1 FROM calendars c
      WHERE c.id = calendar_id
      AND c.user_id = auth.uid()
    ) AND
    -- Prevent duplicate pending invites
    NOT EXISTS (
      SELECT 1 FROM calendar_invites ci
      WHERE ci.calendar_id = calendar_id
      AND ci.recipient_email = recipient_email
      AND ci.status = 'pending'
    )
  );

-- Create read policy
CREATE POLICY "calendar_invites_read_policy" ON calendar_invites
  FOR SELECT
  TO authenticated
  USING (
    -- Calendar owner can see all invites
    EXISTS (
      SELECT 1 FROM calendars c
      WHERE c.id = calendar_id
      AND c.user_id = auth.uid()
    ) OR
    -- Recipient can see their invites
    recipient_email = (
      SELECT email FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_invites_lookup 
  ON calendar_invites(calendar_id, recipient_email, status);

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');