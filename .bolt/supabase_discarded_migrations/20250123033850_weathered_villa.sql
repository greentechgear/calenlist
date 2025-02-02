-- First, drop existing notification-related objects
DROP TRIGGER IF EXISTS on_auth_user_created_notification ON auth.users;
DROP FUNCTION IF EXISTS notify_signup();

-- Create a more robust notify_signup function
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
BEGIN
  -- Get the service role URL and key
  url := current_setting('app.settings.service_role_base_url', true);
  key := current_setting('app.settings.service_role_key', true);

  -- Add debug logging
  RAISE LOG 'notify_signup triggered for user % with email %', NEW.id, NEW.email;
  
  -- Validate configuration
  IF url IS NULL OR key IS NULL THEN
    RAISE LOG 'Missing service role configuration';
    RETURN NEW;
  END IF;

  -- Make the HTTP request
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

  -- Log the response
  RAISE LOG 'Signup notification response: %', response;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log any errors but don't fail the transaction
  RAISE LOG 'Error in notify_signup: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created_notification
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION notify_signup();