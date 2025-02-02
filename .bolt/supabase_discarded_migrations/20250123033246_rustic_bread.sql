-- Create a table to log signup notifications if it doesn't exist
CREATE TABLE IF NOT EXISTS signup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  email text,
  trigger_success boolean,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE signup_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert
CREATE POLICY "service_role_can_insert_logs" ON signup_logs
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Allow admins to view logs
CREATE POLICY "admins_can_view_logs" ON signup_logs
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com');

-- Update notify_signup function with proper error handling
CREATE OR REPLACE FUNCTION notify_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
BEGIN
  -- Create initial log entry
  INSERT INTO signup_logs (user_id, email)
  VALUES (NEW.id, NEW.email)
  RETURNING id INTO log_id;

  -- Attempt to call the edge function
  BEGIN
    PERFORM net.http_post(
      url := current_setting('app.settings.service_role_base_url', true) || '/functions/v1/signup-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'record', jsonb_build_object(
          'id', NEW.id,
          'email', NEW.email,
          'created_at', NEW.created_at
        )
      )
    );

    -- Update log with success
    UPDATE signup_logs 
    SET trigger_success = true
    WHERE id = log_id;

  EXCEPTION WHEN OTHERS THEN
    -- Update log with error
    UPDATE signup_logs 
    SET 
      trigger_success = false,
      error_message = SQLERRM
    WHERE id = log_id;
    
    -- Log error but don't fail the trigger
    RAISE WARNING 'Error in notify_signup: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created_notification ON auth.users;
CREATE TRIGGER on_auth_user_created_notification
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION notify_signup();