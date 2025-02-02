-- Create function to handle email verification
CREATE OR REPLACE FUNCTION handle_email_verification()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log verification attempt
  INSERT INTO signup_logs (
    user_id,
    email,
    response_data
  ) VALUES (
    NEW.id,
    NEW.email,
    jsonb_build_object(
      'email_verification_requested', true,
      'timestamp', now()
    )
  );

  -- Don't auto-confirm email anymore to ensure verification flow works
  IF NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE auth.users 
    SET email_confirmed_at = NULL 
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for email verification
DROP TRIGGER IF EXISTS on_email_verification ON auth.users;
CREATE TRIGGER on_email_verification
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_email_verification();

-- Update handle_new_user to not auto-confirm email
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

  -- Simple direct insert with conflict handling
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

  -- Log signup attempt
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
      'timestamp', now()
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

-- Drop and recreate trigger to use updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');