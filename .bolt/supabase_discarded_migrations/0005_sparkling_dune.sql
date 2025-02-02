/*
  # Add email column to profiles

  1. Changes
    - Add email column to profiles table if it doesn't exist
    - Update existing profiles with email from auth.users
    - Add policy for viewing emails
*/

-- Add email column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text;
  END IF;
END $$;

-- Update existing profiles with email from auth.users
UPDATE profiles
SET email = users.email
FROM auth.users
WHERE profiles.id = users.id
AND profiles.email IS NULL;