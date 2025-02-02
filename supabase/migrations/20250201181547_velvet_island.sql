-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_email_confirmation() CASCADE;

-- Create comprehensive user handler with improved error handling and RLS bypass
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

  -- Early return if profile exists (with RLS bypass)
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.id
    FOR UPDATE SKIP LOCKED
  ) THEN
    UPDATE signup_logs 
    SET response_data = response_data || 
      jsonb_build_object('profile_exists', true)
    WHERE id = log_id;
    RETURN NEW;
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
      -- Use direct INSERT to bypass RLS
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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS on_email_confirmation ON auth.users;
CREATE TRIGGER on_email_confirmation
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_email_confirmation();

-- Update profiles RLS policies
DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Read policy with improved conditions
CREATE POLICY "profiles_read_policy" ON profiles
  FOR SELECT
  USING (
    -- Users can read their own profile
    id = auth.uid() OR
    -- Users can read profiles of public calendar owners
    EXISTS (
      SELECT 1 FROM calendars c
      WHERE c.user_id = profiles.id
      AND c.is_public = true
    )
  );

-- Insert policy for authenticated users
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT 
  WITH CHECK (
    -- Users can only insert their own profile
    id = auth.uid()
  );

-- Update policy
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Ensure proper grants
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');