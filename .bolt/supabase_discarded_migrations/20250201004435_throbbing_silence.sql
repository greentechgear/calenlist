-- First, ensure http extension is enabled
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA extensions;

-- Create a composite type for http headers if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'http_header') THEN
    CREATE TYPE extensions.http_header AS (
      field_name text,
      field_value text
    );
  END IF;
END $$;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO postgres, authenticated, anon;

-- Grant execute permission on http functions with correct signatures
GRANT EXECUTE ON FUNCTION extensions.http(method text, url text) TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION extensions.http(method text, url text, headers extensions.http_header[]) TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION extensions.http(method text, url text, headers extensions.http_header[], content_type text) TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION extensions.http(method text, url text, headers extensions.http_header[], content_type text, content text) TO postgres, authenticated, anon;