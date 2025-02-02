-- Add length check constraint to description column
DO $$ 
BEGIN
  -- Add length check constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'calendars_description_length_check'
  ) THEN
    ALTER TABLE calendars
    ADD CONSTRAINT calendars_description_length_check
    CHECK (length(description) <= 200);
  END IF;
END $$;

-- Create or replace sanitization function
CREATE OR REPLACE FUNCTION sanitize_text(input_text text)
RETURNS text AS $$
BEGIN
  -- Remove HTML tags
  input_text := regexp_replace(input_text, '<[^>]*>', '', 'g');
  -- Remove URLs
  input_text := regexp_replace(input_text, '(https?:\/\/[^\s]+)', '', 'g');
  -- Remove consecutive spaces/newlines
  input_text := regexp_replace(input_text, '\s+', ' ', 'g');
  -- Trim
  input_text := trim(input_text);
  RETURN input_text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION sanitize_calendar_description()
RETURNS trigger AS $$
BEGIN
  IF NEW.description IS NOT NULL THEN
    NEW.description := sanitize_text(NEW.description);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sanitize_calendar_description_trigger ON calendars;

-- Create trigger
CREATE TRIGGER sanitize_calendar_description_trigger
  BEFORE INSERT OR UPDATE ON calendars
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_calendar_description();