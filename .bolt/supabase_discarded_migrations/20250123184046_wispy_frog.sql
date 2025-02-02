-- Drop existing triggers to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_notification ON auth.users;

-- Create a function to handle both profile creation and logging
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
  request_id text := gen_random_uuid()::text;
BEGIN
  -- First create the signup log entry
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
    false, -- Will update to true if successful
    now()
  )
  RETURNING id INTO log_id;

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

  EXCEPTION WHEN OTHERS THEN
    -- Update log with error but don't fail transaction
    UPDATE signup_logs
    SET 
      error_message = 'Profile creation failed: ' || SQLERRM,
      trigger_success = false
    WHERE id = log_id;
    
    RAISE WARNING 'Profile creation error: %', SQLERRM;
  END;

  -- Attempt to send notification
  BEGIN
    -- Get service role configuration
    DECLARE
      base_url text;
      api_key text;
    BEGIN
      SELECT value INTO base_url FROM app_settings WHERE key = 'service_role_base_url';
      SELECT value INTO api_key FROM app_settings WHERE key = 'service_role_key';

      IF base_url IS NULL OR api_key IS NULL THEN
        RAISE EXCEPTION 'Missing service role configuration';
      END IF;

      -- Make the HTTP request
      PERFORM net.http_post(
        url := base_url || '/functions/v1/signup-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || api_key
        ),
        body := jsonb_build_object(
          'record', jsonb_build_object(
            'id', NEW.id,
            'email', NEW.email,
            'created_at', NEW.created_at,
            'request_id', request_id
          )
        )
      );

      -- Update log with notification success
      UPDATE signup_logs
      SET response_data = jsonb_build_object(
        'notification_sent', true,
        'timestamp', now()
      )
      WHERE id = log_id;

    EXCEPTION WHEN OTHERS THEN
      -- Update log with error
      UPDATE signup_logs
      SET error_message = COALESCE(error_message, '') || ' | Notification error: ' || SQLERRM
      WHERE id = log_id;
      
      RAISE WARNING 'Notification error: %', SQLERRM;
    END;
  END;

  RETURN NEW;
END;
$$;

-- Create single trigger that handles everything
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure proper permissions
GRANT USAGE ON SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, authenticated, anon;

-- Verify service role configuration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM app_settings 
    WHERE key IN ('service_role_base_url', 'service_role_key')
  ) THEN
    RAISE WARNING 'Service role configuration missing from app_settings';
  END IF;
END $$;