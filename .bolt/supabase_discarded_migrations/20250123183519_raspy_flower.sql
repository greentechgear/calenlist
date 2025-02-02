-- Drop existing triggers to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_notification ON auth.users;

-- Ensure signup_logs table exists with proper structure
CREATE TABLE IF NOT EXISTS signup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  trigger_success boolean,
  error_message text,
  response_data jsonb,
  request_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE signup_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert
CREATE POLICY "service_role_can_insert_logs" ON signup_logs
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Allow admins to view logs
CREATE POLICY "admins_can_view_logs" ON signup_logs
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' = 'slimhokie@gmail.com');

-- Create a function to handle profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_name text;
  log_id uuid;
BEGIN
  -- Get display_name from metadata or fallback to email username
  display_name := COALESCE(
    (new.raw_user_meta_data->>'display_name')::text,
    split_part(new.email, '@', 1)
  );

  -- Create initial log entry
  INSERT INTO signup_logs (user_id, email, request_id)
  VALUES (NEW.id, NEW.email, gen_random_uuid()::text)
  RETURNING id INTO log_id;

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

    -- Update log with success
    UPDATE signup_logs 
    SET trigger_success = true
    WHERE id = log_id;

  EXCEPTION 
    WHEN unique_violation THEN
      -- If profile already exists, update it
      UPDATE profiles
      SET
        email = new.email,
        display_name = display_name,
        updated_at = now()
      WHERE id = new.id;

      -- Update log
      UPDATE signup_logs 
      SET 
        trigger_success = true,
        error_message = 'Profile already existed - updated'
      WHERE id = log_id;

    WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      UPDATE signup_logs 
      SET 
        trigger_success = false,
        error_message = SQLERRM
      WHERE id = log_id;
      
      RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  END;

  -- Trigger notification in a separate transaction
  BEGIN
    PERFORM net.http_post(
      url := (SELECT value FROM app_settings WHERE key = 'service_role_base_url') || '/functions/v1/signup-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM app_settings WHERE key = 'service_role_key')
      ),
      body := jsonb_build_object(
        'record', jsonb_build_object(
          'id', NEW.id,
          'email', NEW.email,
          'created_at', NEW.created_at,
          'request_id', (SELECT request_id FROM signup_logs WHERE id = log_id)
        )
      )
    );

    -- Update log with notification success
    UPDATE signup_logs 
    SET response_data = jsonb_build_object('notification_sent', true)
    WHERE id = log_id;

  EXCEPTION WHEN OTHERS THEN
    -- Log notification error but don't fail the transaction
    UPDATE signup_logs 
    SET 
      error_message = COALESCE(error_message, '') || ' | Notification error: ' || SQLERRM
    WHERE id = log_id;
    
    RAISE WARNING 'Error sending notification: %', SQLERRM;
  END;

  RETURN new;
END;
$$;

-- Create single trigger for both profile creation and notification
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure proper permissions
GRANT USAGE ON SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, authenticated, anon;

-- Verify service role configuration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM app_settings 
    WHERE key IN ('service_role_base_url', 'service_role_key')
  ) THEN
    RAISE WARNING 'Service role configuration missing from app_settings';
  END IF;
END $$;