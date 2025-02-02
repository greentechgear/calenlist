-- Create signup_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS signup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  request_id text,
  trigger_success boolean DEFAULT false,
  error_message text,
  response_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Drop all existing policies
DROP POLICY IF EXISTS "anyone_can_insert_logs" ON signup_logs;
DROP POLICY IF EXISTS "anyone_can_update_logs" ON signup_logs;
DROP POLICY IF EXISTS "admins_can_view_logs" ON signup_logs;
DROP POLICY IF EXISTS "service_role_can_insert_logs" ON signup_logs;

-- Recreate policies
CREATE POLICY "anyone_can_insert_logs"
  ON signup_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "anyone_can_update_logs"
  ON signup_logs FOR UPDATE
  USING (true);

CREATE POLICY "admins_can_view_logs"
  ON signup_logs FOR SELECT
  USING (auth.jwt() ->> 'email' = 'slimhokie@gmail.com');

-- Enable RLS
ALTER TABLE signup_logs ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON TABLE signup_logs TO postgres, authenticated, anon;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_signup_logs_user_id ON signup_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_signup_logs_created_at ON signup_logs(created_at);