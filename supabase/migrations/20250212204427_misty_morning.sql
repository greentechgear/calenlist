-- Drop existing functions
DROP FUNCTION IF EXISTS get_pending_invites;
DROP FUNCTION IF EXISTS handle_calendar_subscription;

-- Create improved function to get pending invites
CREATE OR REPLACE FUNCTION get_pending_invites(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  calendar_id uuid,
  sender_id uuid,
  recipient_email text,
  status text,
  created_at timestamptz,
  calendar jsonb,
  sender jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.calendar_id,
    ci.sender_id,
    ci.recipient_email,
    ci.status,
    ci.created_at,
    jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'description', c.description,
      'is_public', c.is_public,
      'banner', c.banner,
      'google_calendar_url', c.google_calendar_url,
      'profiles', jsonb_build_object(
        'display_name', cp.display_name
      )
    ) as calendar,
    jsonb_build_object(
      'display_name', sp.display_name
    ) as sender
  FROM calendar_invites ci
  JOIN calendars c ON c.id = ci.calendar_id
  LEFT JOIN profiles cp ON cp.id = c.user_id
  LEFT JOIN profiles sp ON sp.id = ci.sender_id
  WHERE ci.recipient_email = (
    SELECT email FROM profiles WHERE id = p_user_id
  )
  AND ci.status = 'pending'
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.calendar_id = ci.calendar_id
    AND s.user_id = p_user_id
  );
END;
$$;

-- Create improved function to handle subscriptions
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
  v_subscription_id uuid;
BEGIN
  -- Get user's email with retry
  SELECT email INTO v_user_email
  FROM profiles
  WHERE id = p_user_id;

  IF v_user_email IS NULL THEN
    -- Create profile if it doesn't exist
    INSERT INTO profiles (id, email, display_name)
    SELECT 
      p_user_id,
      (SELECT email FROM auth.users WHERE id = p_user_id),
      COALESCE(
        (SELECT raw_user_meta_data->>'display_name' FROM auth.users WHERE id = p_user_id),
        'User ' || substr(p_user_id::text, 1, 8)
      )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email
    RETURNING email INTO v_user_email;
  END IF;

  -- Create subscription with proper locking
  INSERT INTO subscriptions (user_id, calendar_id)
  VALUES (p_user_id, p_calendar_id)
  ON CONFLICT (user_id, calendar_id) DO NOTHING
  RETURNING id INTO v_subscription_id;

  -- Update any pending invites to 'accepted'
  UPDATE calendar_invites
  SET 
    status = 'accepted',
    accepted_at = now()
  WHERE calendar_id = p_calendar_id
  AND recipient_email = v_user_email
  AND status = 'pending';

  RETURN v_subscription_id IS NOT NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error handling subscription: %', SQLERRM;
  RETURN false;
END;
$$;

-- Create indexes for better performance
DROP INDEX IF EXISTS idx_calendar_invites_status_email;
CREATE INDEX idx_calendar_invites_status_email 
  ON calendar_invites(recipient_email, status)
  INCLUDE (calendar_id, sender_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_subscriptions_lookup
  ON subscriptions(user_id, calendar_id);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_calendar_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_invites TO authenticated;

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');