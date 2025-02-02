-- Ensure settings are loaded
DO $$
DECLARE
  base_url text;
  api_key text;
BEGIN
  -- First check if settings exist in the table
  SELECT value INTO base_url FROM app_settings WHERE key = 'service_role_base_url';
  SELECT value INTO api_key FROM app_settings WHERE key = 'service_role_key';

  -- If not found in table, try to get from current settings
  IF base_url IS NULL THEN
    base_url := current_setting('app.settings.service_role_base_url', true);
  END IF;
  
  IF api_key IS NULL THEN
    api_key := current_setting('app.settings.service_role_key', true);
  END IF;

  -- If we have values, ensure they're stored in both places
  IF base_url IS NOT NULL AND api_key IS NOT NULL THEN
    -- Store in settings table
    INSERT INTO app_settings (key, value)
    VALUES 
      ('service_role_base_url', base_url),
      ('service_role_key', api_key)
    ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value,
          updated_at = now();
          
    -- Set current session
    PERFORM set_config('app.settings.service_role_base_url', base_url, false);
    PERFORM set_config('app.settings.service_role_key', api_key, false);
  END IF;
END $$;

-- Verify configuration
SELECT * FROM check_service_role_config();