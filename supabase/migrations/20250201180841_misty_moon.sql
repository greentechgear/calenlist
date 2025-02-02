-- Create improved profile handler with better error handling and validation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  profile_id uuid;
  display_name_val text;
  retry_count integer := 0;
  max_retries constant integer := 3;
  backoff_interval constant interval := '100 milliseconds';
BEGIN
  -- Early return if profile exists
  IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Validate and sanitize email
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RAISE WARNING 'Empty email for user %', NEW.id;
  END IF;

  -- Get display name with improved validation
  display_name_val := COALESCE(
    NULLIF(TRIM((NEW.raw_user_meta_data->>'display_name')::text), ''),
    CASE 
      WHEN NEW.email IS NOT NULL AND NEW.email != '' 
      THEN regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9\s._-]', '', 'g')
      ELSE 'User ' || substr(NEW.id::text, 1, 8)
    END
  );

  -- Ensure display name meets minimum length
  IF length(display_name_val) < 2 THEN
    display_name_val := 'User ' || substr(NEW.id::text, 1, 8);
  END IF;

  -- Profile creation with retries and proper error handling
  LOOP
    BEGIN
      INSERT INTO profiles (id, email, display_name)
      VALUES (
        NEW.id,
        COALESCE(NULLIF(TRIM(NEW.email), ''), 'pending@example.com'),
        display_name_val
      )
      ON CONFLICT (id) DO UPDATE 
      SET 
        email = EXCLUDED.email,
        display_name = EXCLUDED.display_name,
        updated_at = now()
      WHERE profiles.id = NEW.id
      RETURNING id INTO profile_id;

      -- Verify profile was created
      IF profile_id IS NOT NULL THEN
        -- Log successful profile creation
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
      END IF;

      retry_count := retry_count + 1;
      EXIT WHEN retry_count >= max_retries;
      
      -- Exponential backoff
      PERFORM pg_sleep(extract(epoch from (backoff_interval * power(2, retry_count - 1))));
      
    EXCEPTION WHEN OTHERS THEN
      -- Log the error
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
          'attempt', retry_count + 1,
          'timestamp', now()
        )
      );
      
      retry_count := retry_count + 1;
      EXIT WHEN retry_count >= max_retries;
      
      -- Exponential backoff
      PERFORM pg_sleep(extract(epoch from (backoff_interval * power(2, retry_count - 1))));
    END;
  END LOOP;

  -- Always return NEW to prevent auth failures
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger to ensure it uses the latest function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create index to improve profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');