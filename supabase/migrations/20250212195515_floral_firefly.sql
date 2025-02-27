-- Drop existing policies
DROP POLICY IF EXISTS "calendar_invites_insert_policy" ON calendar_invites;
DROP POLICY IF EXISTS "calendar_invites_read_policy" ON calendar_invites;

-- Create simplified insert policy that avoids recursion
CREATE POLICY "calendar_invites_insert_policy" ON calendar_invites AS
  PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Calendar owner can send invites
    EXISTS (
      SELECT 1 FROM calendars
      WHERE id = calendar_invites.calendar_id
      AND user_id = auth.uid()
    )
  );

-- Create simplified read policy that avoids recursion
CREATE POLICY "calendar_invites_read_policy" ON calendar_invites AS
  PERMISSIVE FOR SELECT
  TO authenticated
  USING (
    -- Calendar owner can see all invites for their calendars
    EXISTS (
      SELECT 1 FROM calendars
      WHERE id = calendar_invites.calendar_id
      AND user_id = auth.uid()
    )
    OR
    -- Recipients can see invites sent to them
    recipient_email = (
      SELECT email FROM profiles
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

-- Create function to safely handle invite creation
CREATE OR REPLACE FUNCTION create_calendar_invite(
  p_calendar_id uuid,
  p_recipient_email text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite_id uuid;
BEGIN
  -- Check if sender owns the calendar
  IF NOT EXISTS (
    SELECT 1 FROM calendars
    WHERE id = p_calendar_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to send invites for this calendar';
  END IF;

  -- Check for existing pending invite
  IF EXISTS (
    SELECT 1 FROM calendar_invites
    WHERE calendar_id = p_calendar_id
    AND recipient_email = p_recipient_email
    AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Pending invite already exists';
  END IF;

  -- Create new invite
  INSERT INTO calendar_invites (
    calendar_id,
    sender_id,
    recipient_email,
    status
  )
  VALUES (
    p_calendar_id,
    auth.uid(),
    p_recipient_email,
    'pending'
  )
  RETURNING id INTO v_invite_id;

  RETURN v_invite_id;
END;
$$;

-- Create indexes for better performance
DROP INDEX IF EXISTS idx_calendar_invites_lookup;
CREATE INDEX idx_calendar_invites_lookup 
  ON calendar_invites(calendar_id, recipient_email, status);
CREATE INDEX idx_calendar_invites_recipient 
  ON calendar_invites(recipient_email) 
  WHERE status = 'pending';

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');