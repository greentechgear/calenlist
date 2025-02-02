/*
  # Add Calendar Event Categories

  1. New Tables
    - `calendar_categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `color` (text)
      - `icon` (text)

  2. Changes
    - Add `category_id` to `calendars` table
    - Add foreign key constraint
    - Add default categories

  3. Security
    - Enable RLS
    - Add policies for public read access
*/

-- Create calendar categories table
CREATE TABLE calendar_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  color text NOT NULL,
  icon text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add category to calendars
ALTER TABLE calendars
ADD COLUMN category_id uuid REFERENCES calendar_categories(id);

-- Enable RLS
ALTER TABLE calendar_categories ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Anyone can view calendar categories"
  ON calendar_categories
  FOR SELECT
  USING (true);

-- Insert default categories
INSERT INTO calendar_categories (name, description, color, icon, id) VALUES
  ('Office Hours', 'Regular office hours and availability slots', '#4F46E5', 'clock', '37e3806e-d47c-4ae3-9c12-44a671dcd7c3'),
  ('Consulting', 'Professional consulting sessions', '#059669', 'users', '8a9d6a4f-6d77-4c5c-9de9-9e6e9520cb6a'),
  ('Webinar', 'Online webinars and presentations', '#DC2626', 'video', 'f7d97cf3-43fb-4185-9d34-e50d7c0b8985'),
  ('Workshop', 'Interactive workshops and training sessions', '#D97706', 'graduation-cap', 'c2e3a26e-fd0e-4d43-b930-2b1c8c5fd1b1'),
  ('Conference', 'Conference talks and events', '#7C3AED', 'mic', '9b5e9d6a-0d8f-4c8a-9e4e-6d8f3b7c5a2e'),
  ('Community', 'Community events and meetups', '#EC4899', 'heart', 'e4d97cf3-43fb-4185-9d34-e50d7c0b8985'),
  ('Other', 'Other types of events', '#6B7280', 'calendar', 'b2e3a26e-fd0e-4d43-b930-2b1c8c5fd1b1');