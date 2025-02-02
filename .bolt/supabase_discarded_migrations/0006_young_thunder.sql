/*
  # Add Banner Column to Calendars Table

  1. Changes
    - Add JSONB column `banner` to `calendars` table to store banner configuration
    - Column will store banner theme preferences including:
      - id: string
      - name: string
      - color: string
      - textColor: string
      - pattern: string
*/

-- Add banner column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendars' AND column_name = 'banner'
  ) THEN
    ALTER TABLE calendars ADD COLUMN banner JSONB;
  END IF;
END $$;