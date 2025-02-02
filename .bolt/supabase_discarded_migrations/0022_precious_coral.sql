-- Add description column to calendars table
ALTER TABLE calendars
ADD COLUMN description text;

-- Create function to sanitize text (remove HTML and URLs)
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

-- Add trigger to sanitize description before insert/update
CREATE OR REPLACE FUNCTION sanitize_calendar_description()
RETURNS trigger AS $$
BEGIN
  IF NEW.description IS NOT NULL THEN
    NEW.description := sanitize_text(NEW.description);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sanitize_calendar_description_trigger
  BEFORE INSERT OR UPDATE ON calendars
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_calendar_description();