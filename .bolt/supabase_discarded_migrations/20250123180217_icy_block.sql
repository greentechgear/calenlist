-- First, ensure the app_settings table exists and has the correct data
INSERT INTO app_settings (key, value)
VALUES 
  ('service_role_base_url', 'https://djcicswhmqxwxvuflkad.supabase.co'),
  ('service_role_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqY2ljc3dobXF4d3h2dWZsa2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTE1MzQ0MSwiZXhwIjoyMDUwNzI5NDQxfQ.Wd_hkHNKvfGQqYXyFHrZGHFXYGYBCZBDtLGOYvGLOYE')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- Update the notify_signup function to read from app_settings
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
  -- Get settings from app_settings table
  SELECT value INTO url FROM app_settings WHERE key = 'service_role_base_url';
  SELECT value INTO key FROM app_settings WHERE key = 'service_role_key';

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