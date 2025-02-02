/*
  # Add banner column to calendars table

  1. Changes
    - Add JSONB banner column to calendars table to store banner configuration
      - id: banner preset identifier
      - name: display name of the banner
      - color: background color
      - textColor: text color
      - pattern: visual pattern type
*/

ALTER TABLE calendars
ADD COLUMN IF NOT EXISTS banner JSONB;