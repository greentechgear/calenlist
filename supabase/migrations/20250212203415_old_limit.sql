-- Create function to handle subscription creation and invite cleanup
CREATE OR REPLACE FUNCTION handle_calendar_subscription(
  p_user_id uuid,
  p_calendar_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
BEGIN
  -- Get user's email
  SELECT email INTO v_user_email
  FROM profiles
  WHERE id = p_user_id;

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Create subscription
  INSERT INTO subscriptions (user_id, calendar_id)
  VALUES (p_user_id, p_calendar_id)
  ON CONFLICT (user_id, calendar_id) DO NOTHING;

  -- Update any pending invites to 'accepted'
  UPDATE calendar_invites
  SET 
    status = 'accepted',
    accepted_at = now()
  WHERE calendar_id = p_calendar_id
  AND recipient_email = v_user_email
  AND status = 'pending';

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error handling subscription: %', SQLERRM;
  RETURN false;
END;
$$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_invites_status_email 
  ON calendar_invites(calendar_id, recipient_email)
  WHERE status = 'pending';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION handle_calendar_subscription TO authenticated;