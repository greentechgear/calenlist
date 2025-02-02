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

-- Grant execute permission on http functions
GRANT EXECUTE ON FUNCTION extensions.http(text, text) TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION extensions.http(text, text, extensions.http_header[]) TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION extensions.http(text, text, extensions.http_header[], text) TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION extensions.http(text, text, extensions.http_header[], text, text) TO postgres, authenticated, anon;