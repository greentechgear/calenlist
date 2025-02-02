/*
  # Remove Other category and update references

  1. Changes
    - Update any calendars using the "Other" category to use Conference category
    - Remove the "Other" category from calendar_categories
  
  2. Safety
    - Updates references before deletion to maintain referential integrity
    - Uses DO block to handle the update safely
*/

DO $$ 
BEGIN
  -- First update any calendars using the Other category
  UPDATE calendars 
  SET category_id = '9b5e9d6a-0d8f-4c8a-9e4e-6d8f3b7c5a2e' -- Conference category
  WHERE category_id = 'b2e3a26e-fd0e-4d43-b930-2b1c8c5fd1b1'; -- Other category

  -- Then delete the Other category
  DELETE FROM calendar_categories 
  WHERE id = 'b2e3a26e-fd0e-4d43-b930-2b1c8c5fd1b1';
END $$;