-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_email_error() CASCADE;
DROP FUNCTION IF EXISTS track_email_attempt() CASCADE;

-- Create comprehensive user handler with improved error handling
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
  log_id uuid;
BEGIN
  -- Start transaction logging
  INSERT INTO signup_logs (
    user_id,
    email,
    response_data
  ) VALUES (
    NEW.id,
    NEW.email,
    jsonb_build_object(
      'signup_started', true,
      'timestamp', now()
    )
  ) RETURNING id INTO log_id;

  -- Early return if profile exists
  IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
    -- Update log
    UPDATE signup_logs 
    SET response_data = response_data || 
      jsonb_build_object('profile_exists', true)
    WHERE id = log_id;
    RETURN NEW;
  END IF;

  -- Validate and sanitize email
  IF NEW.email IS NULL OR NEW.email = '' THEN
    -- Log warning
    UPDATE signup_logs 
    SET 
      error_message = 'Empty email provided',
      response_data = response_data || 
        jsonb_build_object('email_validation_failed', true)
    WHERE id = log_id;
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
        -- Update log with success
        UPDATE signup_logs 
        SET response_data = response_data || 
          jsonb_build_object(
            'profile_created', true,
            'display_name', display_name_val,
            'attempt_count', retry_count + 1
          )
        WHERE id = log_id;
        
        RETURN NEW;
      END IF;

      retry_count := retry_count + 1;
      
      -- Update log with retry attempt
      UPDATE signup_logs 
      SET response_data = response_data || 
        jsonb_build_object(
          'retry_attempt', retry_count,
          'timestamp', now()
        )
      WHERE id = log_id;

      EXIT WHEN retry_count >= max_retries;
      
      -- Exponential backoff
      PERFORM pg_sleep(extract(epoch from (backoff_interval * power(2, retry_count - 1))));
      
    EXCEPTION WHEN OTHERS THEN
      -- Log the error
      UPDATE signup_logs 
      SET 
        error_message = SQLERRM,
        response_data = response_data || 
          jsonb_build_object(
            'error_attempt', retry_count + 1,
            'error_timestamp', now()
          )
      WHERE id = log_id;
      
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

-- Create function to handle email confirmation
CREATE OR REPLACE FUNCTION handle_email_confirmation()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Track email confirmation attempt
  INSERT INTO signup_logs (
    user_id,
    email,
    response_data
  ) VALUES (
    NEW.id,
    NEW.email,
    jsonb_build_object(
      'email_confirmation_attempt', true,
      'confirmed', NEW.email_confirmed_at IS NOT NULL,
      'timestamp', now()
    )
  );

  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_email_confirmation
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_email_confirmation();

-- Update signup_logs table
ALTER TABLE signup_logs
  ADD COLUMN IF NOT EXISTS attempt_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt timestamptz;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_signup_logs_user_id ON signup_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_signup_logs_email ON signup_logs(email);
CREATE INDEX IF NOT EXISTS idx_signup_logs_created_at ON signup_logs(created_at);

-- Update RLS policies
ALTER TABLE signup_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "signup_logs_insert_policy" ON signup_logs;
CREATE POLICY "signup_logs_insert_policy" ON signup_logs
  FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "signup_logs_select_policy" ON signup_logs;
CREATE POLICY "signup_logs_select_policy" ON signup_logs
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE email = 'slimhokie@gmail.com'
    )
  );

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');