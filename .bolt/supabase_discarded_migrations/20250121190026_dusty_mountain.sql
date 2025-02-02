-- Create settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Only allow service_role access
CREATE POLICY "service_role_can_manage_settings" ON app_settings
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Update set_service_role_config function to use the table
CREATE OR REPLACE FUNCTION set_service_role_config(
  base_url text,
  api_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Store in the settings table
  INSERT INTO app_settings (key, value)
  VALUES 
    ('service_role_base_url', base_url),
    ('service_role_key', api_key)
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = now();
    
  -- Set for current session
  PERFORM set_config('app.settings.service_role_base_url', base_url, false);
  PERFORM set_config('app.settings.service_role_key', api_key, false);
END;
$$;

-- Update check function to read from both table and session
CREATE OR REPLACE FUNCTION check_service_role_config()
RETURNS TABLE (
  base_url text,
  key_set boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(
      current_setting('app.settings.service_role_base_url', true),
      (SELECT value FROM app_settings WHERE key = 'service_role_base_url')
    ),
    COALESCE(
      current_setting('app.settings.service_role_key', true) IS NOT NULL,
      EXISTS (SELECT 1 FROM app_settings WHERE key = 'service_role_key')
    );
END;
$$;

-- Grant necessary permissions
GRANT ALL ON app_settings TO postgres;
GRANT EXECUTE ON FUNCTION set_service_role_config TO postgres;
GRANT EXECUTE ON FUNCTION check_service_role_config TO postgres;

-- Load any existing settings
DO $$
DECLARE
  base_url text;
  api_key text;
BEGIN
  SELECT value INTO base_url FROM app_settings WHERE key = 'service_role_base_url';
  SELECT value INTO api_key FROM app_settings WHERE key = 'service_role_key';
  
  IF base_url IS NOT NULL AND api_key IS NOT NULL THEN
    PERFORM set_config('app.settings.service_role_base_url', base_url, false);
    PERFORM set_config('app.settings.service_role_key', api_key, false);
  END IF;
END $$;