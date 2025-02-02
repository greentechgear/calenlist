-- Create signup logs table
CREATE TABLE IF NOT EXISTS signup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  trigger_success boolean,
  error_message text,
  response_data jsonb,
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
  USING (auth.jwt() ->> 'email' = 'slimhokie@gmail.com');

-- Update notify_signup function to include logging
CREATE OR REPLACE FUNCTION notify_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  url text;
  key text;
  response json;
  log_id uuid;
BEGIN
  -- Get the service role URL and key
  url := current_setting('app.settings.service_role_base_url', true);
  key := current_setting('app.settings.service_role_key', true);

  -- Create initial log entry
  INSERT INTO signup_logs (user_id, email)
  VALUES (NEW.id, NEW.email)
  RETURNING id INTO log_id;

  -- Add debug logging
  RAISE LOG 'notify_signup triggered for user % with email %', NEW.id, NEW.email;
  
  -- Validate configuration
  IF url IS NULL OR key IS NULL THEN
    RAISE LOG 'Missing service role configuration';
    
    -- Update log with error
    UPDATE signup_logs 
    SET 
      trigger_success = false,
      error_message = 'Missing service role configuration'
    WHERE id = log_id;
    
    RETURN NEW;
  END IF;

  -- Make the HTTP request
  BEGIN
    SELECT content::json INTO response
    FROM net.http_post(
      url := url || '/functions/v1/signup-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || key
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
    SET 
      trigger_success = true,
      response_data = response
    WHERE id = log_id;

    RAISE LOG 'Signup notification response: %', response;
  EXCEPTION WHEN OTHERS THEN
    -- Update log with error
    UPDATE signup_logs 
    SET 
      trigger_success = false,
      error_message = SQLERRM
    WHERE id = log_id;
    
    RAISE LOG 'Error in notify_signup: %', SQLERRM;
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