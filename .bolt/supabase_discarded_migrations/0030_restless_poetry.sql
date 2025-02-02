-- Add demo video URL column
ALTER TABLE calendars
ADD COLUMN IF NOT EXISTS demo_video_url text,
ADD CONSTRAINT demo_video_url_format
CHECK (
  demo_video_url IS NULL OR 
  demo_video_url ~ '^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+$'
);