-- First, drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_notification ON auth.users;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.notify_signup();

-- Create a more robust handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  display_name text;
BEGIN
  -- Get display_name from metadata or fallback to email
  display_name := COALESCE(
    (new.raw_user_meta_data->>'display_name')::text,
    split_part(new.email, '@', 1)
  );

  -- Insert into profiles with proper error handling
  BEGIN
    INSERT INTO public.profiles (
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
  EXCEPTION WHEN unique_violation THEN
    -- If profile already exists, update it
    UPDATE public.profiles
    SET
      email = new.email,
      display_name = display_name,
      updated_at = now()
    WHERE id = new.id;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a more robust notify_signup function
CREATE OR REPLACE FUNCTION public.notify_signup()
RETURNS trigger AS $$
BEGIN
  -- Only attempt to call the edge function if the URL is configured
  IF current_setting('app.settings.service_role_base_url', true) IS NOT NULL THEN
    PERFORM net.http_post(
      url := current_setting('app.settings.service_role_base_url') || '/functions/v1/signup-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'record', jsonb_build_object(
          'id', NEW.id,
          'email', NEW.email
        )
      )
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Error in notify_signup: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers in the correct order
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_notification
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_signup();

-- Ensure http extension is enabled
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO postgres, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, authenticated, anon;