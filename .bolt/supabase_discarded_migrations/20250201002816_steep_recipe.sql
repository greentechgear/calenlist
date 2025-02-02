-- Drop existing constraint if it exists
ALTER TABLE calendars 
DROP CONSTRAINT IF EXISTS google_calendar_url_format;

-- Create a function to validate calendar URLs
CREATE OR REPLACE FUNCTION is_valid_calendar_url(url text)
RETURNS boolean AS $$
BEGIN
  -- Allow null URLs
  IF url IS NULL THEN
    RETURN true;
  END IF;

  -- Basic URL validation
  IF NOT (
    url ~* '^https?://[a-z0-9.-]+\.[a-z]{2,}/'
  ) THEN
    RETURN false;
  END IF;

  -- Validate specific calendar URL patterns
  RETURN (
    -- Google Calendar ICS URLs
    url ~* '^https://calendar\.google\.com/calendar/ical/[^/]+/public/basic\.ics$'
    OR
    -- Google Calendar embed URLs
    url ~* '^https://calendar\.google\.com/calendar/embed\?src=[^&]+(&[^&]+)*$'
    OR
    -- Google Calendar settings URLs
    url ~* '^https://calendar\.google\.com/calendar/u/[0-9]+/r/settings/[^/]+$'
    OR
    -- Other valid calendar URLs
    url ~* '\.(ics|ical)$'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add the constraint using the validation function
ALTER TABLE calendars
ADD CONSTRAINT google_calendar_url_format
CHECK (google_calendar_url IS NULL OR is_valid_calendar_url(google_calendar_url));

-- Create an index to improve constraint checking performance
CREATE INDEX IF NOT EXISTS idx_calendars_google_calendar_url 
ON calendars(google_calendar_url)
WHERE google_calendar_url IS NOT NULL;

-- Grant necessary permissions
GRANT ALL ON FUNCTION is_valid_calendar_url(text) TO postgres, authenticated;