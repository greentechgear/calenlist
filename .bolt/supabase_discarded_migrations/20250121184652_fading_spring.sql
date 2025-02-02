-- Drop existing triggers and functions to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created_notification ON auth.users;
DROP FUNCTION IF EXISTS public.notify_signup();

-- Create a more robust notify_signup function
CREATE OR REPLACE FUNCTION public.notify_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  url text;
  key text;
BEGIN
  -- Get the service role URL and key
  url := current_setting('app.settings.service_role_base_url', true);
  key := current_setting('app.settings.service_role_key', true);

  -- Add debug logging to the function
  RAISE LOG 'notify_signup triggered for user %', NEW.id;
  
  IF url IS NULL OR key IS NULL THEN
    RAISE LOG 'Missing service role configuration';
    RETURN NEW;
  END IF;

  -- Make the HTTP request
  PERFORM net.http_post(
    url || '/functions/v1/signup-notification',
    jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || key
    ),
    jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id,
        'email', NEW.email,
        'created_at', NEW.created_at
      )
    )
  );

  RAISE LOG 'notify_signup completed for user %', NEW.id;
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
  EXECUTE FUNCTION public.notify_signup();

-- Ensure the net schema exists
CREATE SCHEMA IF NOT EXISTS net;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.notify_signup TO postgres, authenticated, anon;