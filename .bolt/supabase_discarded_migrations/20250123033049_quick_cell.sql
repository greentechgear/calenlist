-- Create a table to log signup notifications
CREATE TABLE IF NOT EXISTS signup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  email text,
  trigger_success boolean,
  error_message text,
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
  USING (auth.jwt() ->> 'email' = 'admin@example.com');

-- Update notify_signup function to include logging
CREATE OR REPLACE FUNCTION notify_signup()
RETURNS trigger AS $$
BEGIN
  -- Log the attempt
  INSERT INTO signup_logs (user_id, email)
  VALUES (NEW.id, NEW.email);

  -- Attempt to call the edge function
  BEGIN
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

    -- Update log with success
    UPDATE signup_logs 
    SET trigger_success = true
    WHERE user_id = NEW.id
    ORDER BY created_at DESC
    LIMIT 1;

  EXCEPTION WHEN OTHERS THEN
    -- Update log with error
    UPDATE signup_logs 
    SET 
      trigger_success = false,
      error_message = SQLERRM
    WHERE user_id = NEW.id
    ORDER BY created_at DESC
    LIMIT 1;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;