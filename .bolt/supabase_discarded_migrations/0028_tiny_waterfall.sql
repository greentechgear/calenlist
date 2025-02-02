/*
  # Enable Email Verification

  1. Changes
    - Add email confirmation column to track verified emails
*/

-- Add email confirmation column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'email_confirmed_at'
  ) THEN
    ALTER TABLE auth.users
    ADD COLUMN email_confirmed_at TIMESTAMPTZ;
  END IF;
END $$;