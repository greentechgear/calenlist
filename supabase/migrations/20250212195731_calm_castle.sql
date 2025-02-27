-- Drop existing unique index
DROP INDEX IF EXISTS calendar_invites_active_unique;

-- Create function to handle invite creation with proper error handling
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
  v_existing_invite_id uuid;
BEGIN
  -- Check if sender owns the calendar
  IF NOT EXISTS (
    SELECT 1 FROM calendars
    WHERE id = p_calendar_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to send invites for this calendar';
  END IF;

  -- Check for existing invite and handle it
  SELECT id INTO v_existing_invite_id
  FROM calendar_invites
  WHERE calendar_id = p_calendar_id
  AND recipient_email = p_recipient_email
  AND status = 'pending'
  FOR UPDATE SKIP LOCKED;

  IF FOUND THEN
    -- Return existing invite ID
    RETURN v_existing_invite_id;
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
EXCEPTION 
  WHEN unique_violation THEN
    -- Handle race condition - get the existing invite
    SELECT id INTO v_existing_invite_id
    FROM calendar_invites
    WHERE calendar_id = p_calendar_id
    AND recipient_email = p_recipient_email
    AND status = 'pending';
    
    RETURN v_existing_invite_id;
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Create new unique index without INCLUDE clause
CREATE UNIQUE INDEX calendar_invites_active_unique 
  ON calendar_invites(calendar_id, recipient_email, id) 
  WHERE status = 'pending';

-- Update RLS policies to use the function
DROP POLICY IF EXISTS "calendar_invites_insert_policy" ON calendar_invites;
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

-- Create indexes for better performance
DROP INDEX IF EXISTS idx_calendar_invites_lookup;
CREATE INDEX idx_calendar_invites_lookup 
  ON calendar_invites(calendar_id, recipient_email, status, id);

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');