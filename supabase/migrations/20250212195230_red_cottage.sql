-- Drop existing unique constraint
ALTER TABLE calendar_invites 
  DROP CONSTRAINT IF EXISTS calendar_invites_calendar_id_recipient_email_key;

-- Add status column
ALTER TABLE calendar_invites
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'accepted', 'declined', 'expired'));

-- Create partial unique index instead of constraint
CREATE UNIQUE INDEX calendar_invites_active_unique 
  ON calendar_invites(calendar_id, recipient_email) 
  WHERE status = 'pending';

-- Update accept_calendar_invite function to handle status
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
  AND status = 'pending';

  IF v_calendar_id IS NULL THEN
    RETURN false;
  END IF;

  -- Create subscription
  INSERT INTO subscriptions (user_id, calendar_id)
  VALUES (p_user_id, v_calendar_id)
  ON CONFLICT DO NOTHING;

  -- Update invite status
  UPDATE calendar_invites
  SET 
    status = 'accepted',
    accepted_at = now()
  WHERE id = p_invite_id;

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  -- Log error but return false
  RAISE WARNING 'Error accepting invite: %', SQLERRM;
  RETURN false;
END;
$$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_invites_status 
  ON calendar_invites(status);

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');