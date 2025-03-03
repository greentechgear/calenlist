-- Create calendar invites table
CREATE TABLE calendar_invites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_id uuid NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  invite_token uuid NOT NULL DEFAULT uuid_generate_v4(),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(calendar_id, recipient_email)
);

-- Enable RLS
ALTER TABLE calendar_invites ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "calendar_invites_insert_policy" ON calendar_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calendars c
      WHERE c.id = calendar_id
      AND c.user_id = auth.uid()
    )
  );

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

-- Create function to handle invite acceptance
CREATE OR REPLACE FUNCTION accept_calendar_invite(
  p_invite_token uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_calendar_id uuid;
  v_user_email text;
BEGIN
  -- Get user's email
  SELECT email INTO v_user_email
  FROM profiles
  WHERE id = p_user_id;

  -- Find and validate invite
  SELECT calendar_id INTO v_calendar_id
  FROM calendar_invites
  WHERE invite_token = p_invite_token
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
  WHERE invite_token = p_invite_token;

  RETURN true;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON calendar_invites TO authenticated;
GRANT EXECUTE ON FUNCTION accept_calendar_invite TO authenticated;

-- Create indexes
CREATE INDEX idx_calendar_invites_token ON calendar_invites(invite_token);
CREATE INDEX idx_calendar_invites_email ON calendar_invites(recipient_email);

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');