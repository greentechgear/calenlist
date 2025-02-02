/*
  # Add email column to profiles table

  1. Changes
    - Add email column to profiles table
    - Update profiles table trigger to include email

  2. Security
    - Email is only visible to the calendar owner
*/

-- Add email column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email text;

-- Update the handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (new.id, new.email, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add policy for viewing emails
CREATE POLICY "Calendar owners can view subscriber emails"
  ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calendars
      WHERE calendars.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM subscriptions
        WHERE subscriptions.calendar_id = calendars.id
        AND subscriptions.user_id = profiles.id
      )
    )
  );