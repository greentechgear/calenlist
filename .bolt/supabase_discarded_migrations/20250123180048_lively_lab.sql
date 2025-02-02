-- First, ensure the app_settings table exists and has the correct data
INSERT INTO app_settings (key, value)
VALUES 
  ('service_role_base_url', 'https://djcicswhmqxwxvuflkad.supabase.co'),
  ('service_role_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqY2ljc3dobXF4d3h2dWZsa2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTE1MzQ0MSwiZXhwIjoyMDUwNzI5NDQxfQ.Wd_hkHNKvfGQqYXyFHrZGHFXYGYBCZBDtLGOYvGLOYE')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- Create a function to load settings on database connection
CREATE OR REPLACE FUNCTION load_service_role_config()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_url text;
  api_key text;
BEGIN
  -- Get settings from table
  SELECT value INTO base_url FROM app_settings WHERE key = 'service_role_base_url';
  SELECT value INTO api_key FROM app_settings WHERE key = 'service_role_key';
  
  -- Set configuration values
  PERFORM set_config('app.settings.service_role_base_url', base_url, false);
  PERFORM set_config('app.settings.service_role_key', api_key, false);
END;
$$;

-- Create an event trigger to load settings on database connection
CREATE OR REPLACE FUNCTION connection_config_trigger()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM load_service_role_config();
END;
$$;

DROP EVENT TRIGGER IF EXISTS load_config_on_connect;
CREATE EVENT TRIGGER load_config_on_connect
  ON ddl_command_end
  WHEN TAG IN ('CREATE SCHEMA', 'ALTER SCHEMA')
  EXECUTE FUNCTION connection_config_trigger();

-- Load the configuration immediately
SELECT load_service_role_config();

-- Verify the configuration
SELECT * FROM check_service_role_config();