-- Drop existing function if it exists
DROP FUNCTION IF EXISTS accept_calendar_invite;

-- Create improved calendar invite acceptance function
CREATE OR REPLACE FUNCTION accept_calendar_invite(
  p_invite_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_calendar_id uuid;
  v_user_email text;
BEGIN
  -- Get user's email
  SELECT email INTO v_user_email
  FROM profiles
  WHERE id = p_user_id;

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Find and validate invite
  SELECT calendar_id INTO v_calendar_id
  FROM calendar_invites
  WHERE id = p_invite_id
  AND recipient_email = v_user_email
  AND accepted_at IS NULL;

  IF v_calendar_id IS NULL THEN
    RETURN false;
  END IF;

  -- Create subscription
  INSERT INTO subscriptions (user_id, calendar_id)
  VALUES (p_user_id, v_calendar_id)
  ON CONFLICT DO NOTHING;

  -- Mark invite as accepted
  UPDATE calendar_invites
  SET accepted_at = now()
  WHERE id = p_invite_id;

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  -- Log error but return false
  RAISE WARNING 'Error accepting invite: %', SQLERRM;
  RETURN false;
END;
$$;