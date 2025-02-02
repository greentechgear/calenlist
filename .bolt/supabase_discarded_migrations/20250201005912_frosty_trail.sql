-- First, let's check if the profiles table has any triggers
DO $$ 
DECLARE
  trigger_record record;
BEGIN
  -- Log any existing triggers on profiles
  RAISE NOTICE 'Checking for triggers on profiles table...';
  FOR trigger_record IN (
    SELECT trigger_name, event_manipulation, action_statement
    FROM information_schema.triggers 
    WHERE event_object_table = 'profiles'
  ) LOOP
    RAISE NOTICE 'Found trigger: % (%) - %', 
      trigger_record.trigger_name, 
      trigger_record.event_manipulation,
      trigger_record.action_statement;
  END LOOP;
END $$;

-- Create a simplified version of handle_new_user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  display_name text;
BEGIN
  -- Set display name with fallback
  display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );

  -- Log the attempt
  RAISE LOG 'Creating profile for user % with email % and display_name %',
    NEW.id, NEW.email, display_name;

  -- Simple insert with minimal fields
  INSERT INTO profiles (
    id,
    email,
    display_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    display_name,
    now(),
    now()
  );

  -- Log success
  RAISE LOG 'Successfully created profile for user %', NEW.id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error details
  RAISE WARNING 'Error creating profile for user %: % (SQLSTATE: %)',
    NEW.id, SQLERRM, SQLSTATE;
  
  -- Create error log entry
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
      'sqlstate', SQLSTATE,
      'context', 'Profile creation failed'
    )
  );

  -- Re-raise the error to ensure we know something went wrong
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure proper permissions
GRANT USAGE ON SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, authenticated, anon;