/*
  # Add Calendar Invite Function
  
  1. New Functions
    - `create_calendar_invite`: Function to create calendar invites with proper error handling
  
  2. Changes
    - Adds a missing function that was referenced but not created
    - Ensures proper permissions for the function
*/

-- Create function to handle calendar invite creation
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_calendar_invite TO authenticated;

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');