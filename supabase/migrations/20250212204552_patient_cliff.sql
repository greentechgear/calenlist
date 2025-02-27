-- Drop existing functions
DROP FUNCTION IF EXISTS get_pending_invites;

-- Create improved function to get pending invites with unambiguous column references
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
  WITH user_email AS (
    SELECT email 
    FROM profiles 
    WHERE profiles.id = p_user_id
  ),
  pending_invites AS (
    SELECT 
      ci.id AS invite_id,
      ci.calendar_id,
      ci.sender_id,
      ci.recipient_email,
      ci.status,
      ci.created_at,
      c.id AS c_id,
      c.name,
      c.description,
      c.is_public,
      c.banner,
      c.google_calendar_url,
      cp.display_name AS calendar_owner_name,
      sp.display_name AS sender_name
    FROM calendar_invites ci
    JOIN calendars c ON c.id = ci.calendar_id
    LEFT JOIN profiles cp ON cp.id = c.user_id
    LEFT JOIN profiles sp ON sp.id = ci.sender_id
    WHERE ci.recipient_email = (SELECT email FROM user_email)
    AND ci.status = 'pending'
    AND NOT EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.calendar_id = ci.calendar_id
      AND s.user_id = p_user_id
    )
  )
  SELECT
    pi.invite_id,
    pi.calendar_id,
    pi.sender_id,
    pi.recipient_email,
    pi.status,
    pi.created_at,
    jsonb_build_object(
      'id', pi.c_id,
      'name', pi.name,
      'description', pi.description,
      'is_public', pi.is_public,
      'banner', pi.banner,
      'google_calendar_url', pi.google_calendar_url,
      'profiles', jsonb_build_object(
        'display_name', pi.calendar_owner_name
      )
    ) as calendar,
    jsonb_build_object(
      'display_name', pi.sender_name
    ) as sender
  FROM pending_invites pi;
END;
$$;

-- Create index for better performance
DROP INDEX IF EXISTS idx_calendar_invites_status_email;
CREATE INDEX idx_calendar_invites_status_email 
  ON calendar_invites(recipient_email, status)
  INCLUDE (calendar_id, sender_id)
  WHERE status = 'pending';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_pending_invites TO authenticated;

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');