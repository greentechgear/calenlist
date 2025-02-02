-- Drop existing triggers to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_notification ON auth.users;

-- Create a simplified handle_new_user function that focuses on profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_name text;
BEGIN
  -- Get display_name from metadata or fallback to email username
  display_name := COALESCE(
    (new.raw_user_meta_data->>'display_name')::text,
    split_part(new.email, '@', 1)
  );

  -- Simple profile creation without extra complexity
  INSERT INTO profiles (
    id,
    email,
    display_name,
    created_at
  )
  VALUES (
    new.id,
    new.email,
    display_name,
    now()
  );

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Error creating profile: %', SQLERRM;
  RETURN new;
END;
$$;

-- Create a separate notification function
CREATE OR REPLACE FUNCTION notify_new_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
  request_id text;
BEGIN
  -- Generate request ID
  request_id := gen_random_uuid()::text;

  -- Create log entry
  INSERT INTO signup_logs (user_id, email, request_id)
  VALUES (NEW.id, NEW.email, request_id)
  RETURNING id INTO log_id;

  -- Attempt notification
  BEGIN
    PERFORM net.http_post(
      url := (SELECT value FROM app_settings WHERE key = 'service_role_base_url') || '/functions/v1/signup-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM app_settings WHERE key = 'service_role_key')
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

    -- Update log with success
    UPDATE signup_logs 
    SET 
      trigger_success = true,
      response_data = jsonb_build_object('notification_sent', true)
    WHERE id = log_id;

  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail
    UPDATE signup_logs 
    SET 
      trigger_success = false,
      error_message = SQLERRM
    WHERE id = log_id;
  END;

  RETURN new;
END;
$$;

-- Create triggers in the correct order
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_auth_user_created_notification
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_signup();

-- Ensure proper permissions
GRANT USAGE ON SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, authenticated, anon;