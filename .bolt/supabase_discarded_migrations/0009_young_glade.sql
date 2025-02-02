/*
  # Add name columns to profiles table

  1. Changes
    - Add first_name and last_name columns to profiles table
    - Make display_name required and add a default value
    - Add migration safety checks
*/

-- Add name columns if they don't exist
DO $$ 
BEGIN
  -- Add first_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_name text;
  END IF;

  -- Add last_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_name text;
  END IF;

  -- Ensure display_name has a default value and is not null
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'display_name' AND is_nullable = 'YES'
  ) THEN
    -- Set default display_name for existing records
    UPDATE profiles 
    SET display_name = email 
    WHERE display_name IS NULL;

    -- Make display_name required
    ALTER TABLE profiles 
    ALTER COLUMN display_name SET NOT NULL,
    ALTER COLUMN display_name SET DEFAULT '';
  END IF;
END $$;