/*
  # Add Calendar Types Support

  1. New Tables
    - `calendar_types`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `color` (text)
      - `icon` (text)

  2. Changes
    - Add `type_id` column to `calendars` table
    - Add RLS policies for calendar types

  3. Default Types
    - Personal
    - Work
    - School
    - Sports
    - Entertainment
    - Community
*/

-- Create calendar types table
CREATE TABLE calendar_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  color text NOT NULL,
  icon text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add type_id to calendars
ALTER TABLE calendars
ADD COLUMN type_id uuid REFERENCES calendar_types(id);

-- Enable RLS
ALTER TABLE calendar_types ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Anyone can view calendar types"
  ON calendar_types
  FOR SELECT
  USING (true);

-- Insert default types
INSERT INTO calendar_types (name, description, color, icon) VALUES
  ('Personal', 'Personal calendar for individual use', '#4F46E5', 'user'),
  ('Work', 'Professional and work-related calendar', '#059669', 'briefcase'),
  ('School', 'Educational and academic calendar', '#DC2626', 'book'),
  ('Sports', 'Sports and fitness events', '#D97706', 'trophy'),
  ('Entertainment', 'Entertainment and leisure events', '#7C3AED', 'music'),
  ('Community', 'Community events and gatherings', '#EC4899', 'users');