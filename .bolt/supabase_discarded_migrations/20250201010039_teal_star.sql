-- Enable http extension
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA extensions;

-- Create http_header type if it doesn't exist
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

-- Create http_response type if it doesn't exist
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO postgres, authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, authenticated, anon;