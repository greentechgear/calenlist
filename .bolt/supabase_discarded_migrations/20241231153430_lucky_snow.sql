-- Make google_calendar_url nullable
ALTER TABLE calendars 
ALTER COLUMN google_calendar_url DROP NOT NULL;

-- Add constraint to ensure URL is valid when provided
ALTER TABLE calendars
ADD CONSTRAINT google_calendar_url_format
CHECK (
  google_calendar_url IS NULL OR 
  google_calendar_url ~ '^https?:\/\/calendar\.google\.com\/.+$' OR
  google_calendar_url ~ '.+@group\.calendar\.google\.com$'
);

-- Add missing_url column to track calendars that need URL
ALTER TABLE calendars
ADD COLUMN needs_url_setup boolean 
GENERATED ALWAYS AS (google_calendar_url IS NULL) STORED;

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "calendars_insert_policy" ON calendars;
CREATE POLICY "calendars_insert_policy" 
ON calendars FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  (google_calendar_url IS NOT NULL OR needs_url_setup)
);