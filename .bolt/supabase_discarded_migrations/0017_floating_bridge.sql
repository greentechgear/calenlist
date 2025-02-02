/*
  # Add Physical Address to Calendars

  1. Changes
    - Add physical_address column to calendars table
    - Add address_visibility column to control address visibility
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add physical address columns
ALTER TABLE calendars
ADD COLUMN physical_address text,
ADD COLUMN address_visibility text DEFAULT 'subscribers' CHECK (address_visibility IN ('public', 'subscribers', 'private'));