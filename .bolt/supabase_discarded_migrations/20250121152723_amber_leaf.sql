-- Set the service role settings
ALTER DATABASE postgres
SET "app.settings.service_role_base_url" = current_setting('app.settings.service_role_base_url', true);

ALTER DATABASE postgres
SET "app.settings.service_role_key" = current_setting('app.settings.service_role_key', true);

-- Enable the http extension with proper schema
DROP EXTENSION IF EXISTS http;
CREATE EXTENSION http WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO postgres, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, authenticated, anon;

-- Ensure the net schema exists and has proper permissions
CREATE SCHEMA IF NOT EXISTS net;
GRANT USAGE ON SCHEMA net TO postgres, authenticated, anon;

-- Create a wrapper function in the net schema for http_post
CREATE OR REPLACE FUNCTION net.http_post(
  url text,
  headers jsonb DEFAULT '{}',
  body jsonb DEFAULT '{}'
)
RETURNS TABLE (
  status int,
  content text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (response ->> 'status')::int as status,
    response ->> 'content' as content
  FROM http((
    'POST',
    url,
    headers,
    body,
    10
  )::http_request);
END;
$$;