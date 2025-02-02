-- Create function to set service role configuration
CREATE OR REPLACE FUNCTION set_service_role_config(
  base_url text,
  api_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set the configuration values
  PERFORM set_config('app.settings.service_role_base_url', base_url, false);
  PERFORM set_config('app.settings.service_role_key', api_key, false);
END;
$$;

-- Grant execute permission to postgres
GRANT EXECUTE ON FUNCTION set_service_role_config TO postgres;

-- Create helper function to check configuration
CREATE OR REPLACE FUNCTION check_service_role_config()
RETURNS TABLE (
  base_url text,
  key_set boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    current_setting('app.settings.service_role_base_url', true) as base_url,
    current_setting('app.settings.service_role_key', true) IS NOT NULL as key_set;
END;
$$;

-- Grant execute permission to postgres
GRANT EXECUTE ON FUNCTION check_service_role_config TO postgres;