-- Create handle_new_user trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create profile with minimal fields
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );

  -- Log success
  INSERT INTO signup_logs (
    user_id,
    email,
    request_id,
    trigger_success,
    created_at,
    response_data
  )
  VALUES (
    NEW.id,
    NEW.email,
    gen_random_uuid()::text,
    true,
    now(),
    jsonb_build_object(
      'success', true,
      'timestamp', now()
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error
  INSERT INTO signup_logs (
    user_id,
    email,
    request_id,
    trigger_success,
    created_at,
    error_message,
    response_data
  )
  VALUES (
    NEW.id,
    NEW.email,
    gen_random_uuid()::text,
    false,
    now(),
    SQLERRM,
    jsonb_build_object(
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    )
  );

  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();