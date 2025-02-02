-- Add validation for streaming URLs
ALTER TABLE calendars
DROP CONSTRAINT IF EXISTS streaming_urls_check;

ALTER TABLE calendars
ADD CONSTRAINT streaming_urls_check
CHECK (
  (streaming_urls IS NULL) OR
  (
    jsonb_typeof(streaming_urls) = 'object' AND
    (
      (streaming_urls->>'Twitch' IS NULL OR streaming_urls->>'Twitch' ~ '^https?:\/\/(www\.)?twitch\.tv\/[\w-]+$') AND
      (streaming_urls->>'YouTube' IS NULL OR streaming_urls->>'YouTube' ~ '^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+$')
    )
  )
);

-- Add custom URL field
ALTER TABLE calendars
ADD COLUMN IF NOT EXISTS custom_url text,
ADD CONSTRAINT custom_url_format
CHECK (
  custom_url IS NULL OR 
  custom_url ~ '^https?:\/\/.+$'
);