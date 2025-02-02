-- First, ensure http extension is enabled
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA extensions;

-- Create the http_response type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_type 
    WHERE typname = 'http_response' 
    AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'extensions')
  ) THEN
    CREATE TYPE extensions.http_response AS (
      status integer,
      content text,
      headers extensions.http_header[]
    );
  END IF;
END $$;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO postgres, authenticated, anon;

-- Grant execute permission on http functions
GRANT EXECUTE ON FUNCTION extensions.http(method text, url text) TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION extensions.http(method text, url text, headers extensions.http_header[]) TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION extensions.http(method text, url text, headers extensions.http_header[], content_type text) TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION extensions.http(method text, url text, headers extensions.http_header[], content_type text, content text) TO postgres, authenticated, anon;