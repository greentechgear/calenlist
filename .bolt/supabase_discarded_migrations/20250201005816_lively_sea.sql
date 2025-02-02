-- First, ensure http extension is enabled
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA extensions;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS extensions.http(text, text, extensions.http_header[], text, text);

-- Create the function with proper parameter names
CREATE OR REPLACE FUNCTION extensions.http(
  p_method text,
  p_url text,
  p_headers extensions.http_header[],
  p_content_type text,
  p_body text
) RETURNS extensions.http_response AS $$
  -- Call the base http function with all parameters
  SELECT * FROM extensions.http(p_method, p_url, p_headers, p_content_type, p_body);
$$ LANGUAGE sql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA extensions TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION extensions.http(text, text, extensions.http_header[], text, text) TO postgres, authenticated, anon;