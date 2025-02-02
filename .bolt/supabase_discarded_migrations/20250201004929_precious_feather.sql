-- First, ensure http extension is enabled
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA extensions;

-- Create the http_header type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_type 
    WHERE typname = 'http_header' 
    AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'extensions')
  ) THEN
    CREATE TYPE extensions.http_header AS (
      field_name text,
      field_value text
    );
  END IF;
END $$;

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

-- Create overloaded http functions if they don't exist
CREATE OR REPLACE FUNCTION extensions.http(
  url text,
  method text DEFAULT 'GET'::text,
  headers extensions.http_header[] DEFAULT '{}'::extensions.http_header[],
  content_type text DEFAULT NULL::text,
  content text DEFAULT NULL::text
) RETURNS extensions.http_response AS $$
  SELECT * FROM extensions.http(method, url, headers, content_type, content);
$$ LANGUAGE sql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO postgres, authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, authenticated, anon;