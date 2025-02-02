-- Drop existing triggers first to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_notification ON auth.users;

-- Create a more robust handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
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

  -- Insert into profiles with proper error handling
  BEGIN
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
  EXCEPTION 
    WHEN unique_violation THEN
      -- If profile already exists, update it
      UPDATE profiles
      SET
        email = new.email,
        display_name = display_name,
        updated_at = now()
      WHERE id = new.id;
    WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
  END;

  -- Always return new to ensure user creation succeeds
  RETURN new;
END;
$$;

-- Create a separate function for notifications
CREATE OR REPLACE FUNCTION public.notify_new_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Attempt notification in a separate transaction
  BEGIN
    PERFORM notify_signup();
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Error sending signup notification: %', SQLERRM;
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