-- Enable the http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA extensions;

-- Drop existing triggers to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_notification ON auth.users;

-- Ensure signup_logs has proper structure
ALTER TABLE signup_logs 
ADD COLUMN IF NOT EXISTS request_id text,
ADD COLUMN IF NOT EXISTS response_data jsonb;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "service_role_can_insert_logs" ON signup_logs;
DROP POLICY IF EXISTS "admins_can_view_logs" ON signup_logs;

-- Create more permissive policies
CREATE POLICY "anyone_can_insert_logs"
  ON signup_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "anyone_can_update_logs"
  ON signup_logs FOR UPDATE
  USING (true);

CREATE POLICY "admins_can_view_logs"
  ON signup_logs FOR SELECT
  USING (auth.jwt() ->> 'email' = 'slimhokie@gmail.com');

-- Create a simplified handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
  request_id text := gen_random_uuid()::text;
  notification_response json;
BEGIN
  RAISE LOG 'Starting handle_new_user for user % with email %', NEW.id, NEW.email;

  -- First create the log entry
  INSERT INTO signup_logs (
    user_id,
    email,
    request_id,
    trigger_success,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    request_id,
    false,
    now()
  )
  RETURNING id INTO log_id;

  RAISE LOG 'Created signup log entry with id %', log_id;

  -- Create the profile
  BEGIN
    INSERT INTO profiles (
      id,
      email,
      display_name,
      created_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      now()
    );

    -- Update log to indicate success
    UPDATE signup_logs
    SET trigger_success = true
    WHERE id = log_id;

    RAISE LOG 'Created profile and updated log success for user %', NEW.id;

  EXCEPTION WHEN OTHERS THEN
    -- Update log with error
    UPDATE signup_logs
    SET 
      error_message = 'Profile creation failed: ' || SQLERRM,
      trigger_success = false
    WHERE id = log_id;
    
    RAISE WARNING 'Profile creation error for user %: %', NEW.id, SQLERRM;
  END;

  -- Send notification
  BEGIN
    SELECT content INTO notification_response
    FROM extensions.http((
      'POST',
      (SELECT value FROM app_settings WHERE key = 'service_role_base_url') || '/functions/v1/signup-notification',
      ARRAY[
        extensions.http_header('Content-Type', 'application/json'),
        extensions.http_header('Authorization', 'Bearer ' || (SELECT value FROM app_settings WHERE key = 'service_role_key'))
      ],
      'application/json',
      jsonb_build_object(
        'record', jsonb_build_object(
          'id', NEW.id,
          'email', NEW.email,
          'created_at', NEW.created_at,
          'request_id', request_id
        )
      )::text
    )::extensions.http_request);

    -- Update log with notification success
    UPDATE signup_logs
    SET response_data = jsonb_build_object(
      'notification_sent', true,
      'timestamp', now(),
      'response', notification_response
    )
    WHERE id = log_id;

    RAISE LOG 'Sent notification for user %', NEW.id;

  EXCEPTION WHEN OTHERS THEN
    -- Update log with error
    UPDATE signup_logs
    SET error_message = COALESCE(error_message, '') || ' | Notification error: ' || SQLERRM
    WHERE id = log_id;
    
    RAISE WARNING 'Notification error for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Create single trigger for everything
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
ALTER TABLE signup_logs ENABLE ROW LEVEL SECURITY;
GRANT ALL ON signup_logs TO postgres, authenticated, anon;
GRANT USAGE ON SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, authenticated, anon;

-- Verify configuration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM app_settings 
    WHERE key IN ('service_role_base_url', 'service_role_key')
  ) THEN
    RAISE WARNING 'Service role configuration missing from app_settings';
  END IF;
END $$;