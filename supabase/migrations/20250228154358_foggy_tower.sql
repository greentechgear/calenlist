/*
  # Add status column to calendar_invites table

  1. Changes
    - Add status column to calendar_invites table with default value 'pending'
    - Update existing rows to have status 'pending'
*/

-- Add status column if it doesn't exist
ALTER TABLE calendar_invites 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_invites_status 
  ON calendar_invites(status);

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');