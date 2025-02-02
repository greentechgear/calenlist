-- Update signup_logs table to allow anonymous inserts and remove user_id constraint
ALTER TABLE signup_logs 
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN ip_address text,
  ADD COLUMN user_agent text;

-- Drop existing policies
DROP POLICY IF EXISTS "signup_logs_read_policy" ON signup_logs;
DROP POLICY IF EXISTS "signup_logs_insert_policy" ON signup_logs;

-- Create new policies
CREATE POLICY "signup_logs_read_policy"
  ON signup_logs FOR SELECT
  TO authenticated
  USING (
    -- Users can read their own logs
    (user_id = auth.uid()) OR
    -- Admins can read all logs (implement admin check later)
    (auth.uid() IN (SELECT id FROM profiles WHERE email = 'slimhokie@gmail.com'))
  );

CREATE POLICY "signup_logs_insert_policy"
  ON signup_logs FOR INSERT
  TO public
  WITH CHECK (true);

-- Create function to handle signup logging
CREATE OR REPLACE FUNCTION log_signup_attempt(
  p_email text,
  p_user_id uuid DEFAULT NULL,
  p_error text DEFAULT NULL,
  p_response jsonb DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO signup_logs (
    user_id,
    email,
    error_message,
    response_data,
    ip_address,
    user_agent
  )
  VALUES (
    p_user_id,
    p_email,
    p_error,
    p_response,
    current_setting('request.headers')::json->>'x-real-ip',
    current_setting('request.headers')::json->>'user-agent'
  );
EXCEPTION 
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Error logging signup attempt: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION log_signup_attempt TO public;

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');