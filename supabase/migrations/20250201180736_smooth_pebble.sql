-- Create function to handle email errors
CREATE OR REPLACE FUNCTION handle_email_error()
RETURNS TRIGGER AS $$
BEGIN
  -- Log email error
  INSERT INTO signup_logs (
    user_id,
    email,
    error_message,
    response_data
  )
  VALUES (
    NEW.id,
    NEW.email,
    'Email confirmation error',
    jsonb_build_object(
      'error_type', 'email_confirmation',
      'timestamp', now()
    )
  );

  -- Return NEW to continue the transaction
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email errors
DROP TRIGGER IF EXISTS on_email_error ON auth.users;
CREATE TRIGGER on_email_error
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NULL)
  EXECUTE FUNCTION handle_email_error();

-- Update signup_logs table
ALTER TABLE signup_logs
  ADD COLUMN IF NOT EXISTS email_attempts integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_email_attempt timestamptz;

-- Create function to track email attempts
CREATE OR REPLACE FUNCTION track_email_attempt()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE signup_logs
  SET 
    email_attempts = COALESCE(email_attempts, 0) + 1,
    last_email_attempt = now()
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for tracking email attempts
DROP TRIGGER IF EXISTS track_email_attempt ON auth.users;
CREATE TRIGGER track_email_attempt
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION track_email_attempt();

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');