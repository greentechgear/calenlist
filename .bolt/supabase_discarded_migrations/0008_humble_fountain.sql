-- Add streaming_urls column to calendars table
ALTER TABLE calendars
ADD COLUMN IF NOT EXISTS streaming_urls JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS name TEXT;

-- Backfill name column with a default value for existing records
UPDATE calendars
SET name = 'Calendar #' || substring(id::text, 1, 8)
WHERE name IS NULL;

-- Make name column required for future inserts
ALTER TABLE calendars
ALTER COLUMN name SET NOT NULL;