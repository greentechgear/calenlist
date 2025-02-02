-- Drop existing policies
DROP POLICY IF EXISTS "anyone_can_insert_logs" ON signup_logs;
DROP POLICY IF EXISTS "anyone_can_update_logs" ON signup_logs;
DROP POLICY IF EXISTS "admins_can_view_logs" ON signup_logs;

-- Create new policies with unique names
CREATE POLICY "signup_logs_insert"
  ON signup_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "signup_logs_update"
  ON signup_logs FOR UPDATE
  USING (true);

CREATE POLICY "signup_logs_select_admin"
  ON signup_logs FOR SELECT
  USING (auth.jwt() ->> 'email' = 'slimhokie@gmail.com');

-- Ensure RLS is enabled
ALTER TABLE signup_logs ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON TABLE signup_logs TO postgres, authenticated, anon;