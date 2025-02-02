-- Create function to handle signup notification
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  display_name_val text;
BEGIN
  -- Get display name with validation
  display_name_val := COALESCE(
    NULLIF(TRIM((NEW.raw_user_meta_data->>'display_name')::text), ''),
    CASE 
      WHEN NEW.email IS NOT NULL AND NEW.email != '' 
      THEN split_part(NEW.email, '@', 1)
      ELSE 'User ' || substr(NEW.id::text, 1, 8)
    END
  );

  -- Create profile directly (bypassing RLS)
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, 'pending@example.com'),
    display_name_val
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    updated_at = now();

  -- Log signup attempt and trigger notification
  INSERT INTO signup_logs (
    user_id,
    email,
    response_data
  ) VALUES (
    NEW.id,
    NEW.email,
    jsonb_build_object(
      'profile_created', true,
      'display_name', display_name_val,
      'notification_pending', true,
      'timestamp', now()
    )
  );

  -- Perform HTTP request to edge function using pg_net extension
  PERFORM net.http_post(
    url := 'https://ofdmqolllaazuopcmhhb.supabase.co/functions/v1/signup-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', current_setting('request.header.authorization', true)
    ),
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id,
        'email', NEW.email,
        'created_at', now()
      )
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail
  INSERT INTO signup_logs (
    user_id,
    email,
    error_message,
    response_data
  ) VALUES (
    NEW.id,
    NEW.email,
    SQLERRM,
    jsonb_build_object(
      'error_type', 'profile_creation',
      'timestamp', now()
    )
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');