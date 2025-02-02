/*
  # Fix signup issues and rate limiting

  1. Changes
    - Create rate limiting for signups
    - Add better error handling for user creation
    - Add signup logging with IP tracking
    - Fix function naming conflicts

  2. Security
    - Enable RLS on signup_logs
    - Add policies for insert and select
    - Add rate limiting function
    - Add secure error handling
*/

-- Create rate limiting function
CREATE OR REPLACE FUNCTION check_signup_rate_limit(p_email text)
RETURNS boolean AS $$
DECLARE
  recent_attempts integer;
BEGIN
  SELECT COUNT(*)
  INTO recent_attempts
  FROM signup_logs
  WHERE email = p_email
    AND created_at > now() - interval '15 minutes';

  RETURN recent_attempts < 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle signup logging
CREATE OR REPLACE FUNCTION log_signup_attempt(
  p_email text,
  p_user_id uuid DEFAULT NULL,
  p_error text DEFAULT NULL,
  p_response jsonb DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Check rate limit
  IF NOT check_signup_rate_limit(p_email) THEN
    RAISE EXCEPTION 'Rate limit exceeded for signup attempts';
  END IF;

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
    current_setting('request.headers', true)::json->>'x-real-ip',
    current_setting('request.headers', true)::json->>'user-agent'
  );
EXCEPTION 
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Error logging signup attempt: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new user profile handler with retries
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  display_name_val text;
  retry_count integer := 0;
  max_retries constant integer := 3;
BEGIN
  -- Get display name from metadata or email
  display_name_val := COALESCE(
    (NEW.raw_user_meta_data->>'display_name')::text,
    CASE 
      WHEN NEW.email IS NOT NULL THEN split_part(NEW.email, '@', 1)
      ELSE 'User ' || substr(NEW.id::text, 1, 8)
    END
  );

  -- Try to create profile with retries
  WHILE retry_count < max_retries LOOP
    BEGIN
      INSERT INTO profiles (id, email, display_name)
      VALUES (NEW.id, NEW.email, display_name_val)
      ON CONFLICT (id) DO NOTHING;
      
      -- Check if insert was successful
      IF FOUND THEN
        RETURN NEW;
      END IF;

      -- If we get here and retry_count = 0, profile already exists
      IF retry_count = 0 AND EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
        RETURN NEW;
      END IF;

      retry_count := retry_count + 1;
      IF retry_count < max_retries THEN
        PERFORM pg_sleep(0.1 * retry_count); -- Exponential backoff
      END IF;
    EXCEPTION WHEN OTHERS THEN
      IF retry_count = max_retries - 1 THEN
        RAISE WARNING 'Failed to create profile after % attempts: %', max_retries, SQLERRM;
      END IF;
      retry_count := retry_count + 1;
      IF retry_count < max_retries THEN
        PERFORM pg_sleep(0.1 * retry_count);
      END IF;
    END;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Update signup_logs RLS policies
DROP POLICY IF EXISTS "signup_logs_read_policy" ON signup_logs;
CREATE POLICY "signup_logs_read_policy"
  ON signup_logs FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE email = 'slimhokie@gmail.com'
    )
  );

DROP POLICY IF EXISTS "signup_logs_insert_policy" ON signup_logs;
CREATE POLICY "signup_logs_insert_policy"
  ON signup_logs FOR INSERT
  TO public
  WITH CHECK (true);

-- Create index for rate limiting
CREATE INDEX IF NOT EXISTS idx_signup_logs_email_time 
  ON signup_logs (email, created_at);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');