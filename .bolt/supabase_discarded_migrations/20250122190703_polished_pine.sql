-- Drop existing constraint
ALTER TABLE calendars
DROP CONSTRAINT IF EXISTS google_calendar_url_format;

-- Add updated constraint that handles both formats and null values
ALTER TABLE calendars
ADD CONSTRAINT google_calendar_url_format
CHECK (
  google_calendar_url IS NULL OR 
  google_calendar_url ~ '^https?:\/\/calendar\.google\.com\/.+$' OR
  google_calendar_url ~ '.+@group\.calendar\.google\.com$' OR
  google_calendar_url ~ '^https?:\/\/.+\.ics$'
);

-- Update existing records that might not match the format
UPDATE calendars
SET google_calendar_url = NULL
WHERE google_calendar_url IS NOT NULL
AND NOT (
  google_calendar_url ~ '^https?:\/\/calendar\.google\.com\/.+$' OR
  google_calendar_url ~ '.+@group\.calendar\.google\.com$' OR
  google_calendar_url ~ '^https?:\/\/.+\.ics$'
);