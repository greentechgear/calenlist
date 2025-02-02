/*
  # Fix Calendar Categories and Foreign Key Constraints

  1. Changes
    - Ensure calendar categories exist
    - Add validation for category_id
    - Fix foreign key constraint issues

  2. Security
    - Maintain proper access control
    - Handle edge cases safely
*/

-- Function to validate category exists
CREATE OR REPLACE FUNCTION validate_calendar_category()
RETURNS TRIGGER AS $$
BEGIN
  -- If category_id is null, that's fine
  IF NEW.category_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if category exists
  IF NOT EXISTS (
    SELECT 1 FROM calendar_categories 
    WHERE id = NEW.category_id
  ) THEN
    RAISE EXCEPTION 'Invalid category_id: category does not exist';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to validate category before calendar operations
DROP TRIGGER IF EXISTS validate_category_before_calendar ON calendars;
CREATE TRIGGER validate_category_before_calendar
  BEFORE INSERT OR UPDATE ON calendars
  FOR EACH ROW
  EXECUTE FUNCTION validate_calendar_category();

-- Ensure default categories exist
INSERT INTO calendar_categories (id, name, description, color, icon)
VALUES 
  ('37e3806e-d47c-4ae3-9c12-44a671dcd7c3', 'Education', 'Educational events and workshops', '#4F46E5', 'graduation-cap'),
  ('e4d97cf3-43fb-4185-9d34-e50d7c0b8985', 'Community', 'Community gatherings and meetups', '#059669', 'users'),
  ('f7d97cf3-43fb-4185-9d34-e50d7c0b8985', 'Entertainment', 'Shows, performances, and entertainment', '#0891B2', 'music'),
  ('8a9d6a4f-6d77-4c5c-9de9-9e6e9520cb6a', 'Business', 'Business and professional events', '#BE123C', 'briefcase'),
  ('c2e3a26e-fd0e-4d43-b930-2b1c8c5fd1b1', 'Sports', 'Sports and fitness activities', '#D97706', 'dumbbell'),
  ('d1e3a26e-fd0e-4d43-b930-2b1c8c5fd1b2', 'Technology', 'Tech events and conferences', '#9333EA', 'laptop'),
  ('e0e3a26e-fd0e-4d43-b930-2b1c8c5fd1b3', 'Arts', 'Art exhibitions and cultural events', '#0369A1', 'palette'),
  ('f9e3a26e-fd0e-4d43-b930-2b1c8c5fd1b4', 'Health', 'Health and wellness events', '#65A30D', 'heart-pulse')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon;

-- Update calendar categories policies
DROP POLICY IF EXISTS "calendar_categories_read_policy" ON calendar_categories;
CREATE POLICY "calendar_categories_read_policy"
  ON calendar_categories FOR SELECT
  TO public
  USING (true);

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');