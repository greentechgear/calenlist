/*
  # Add calendar delete policy

  1. Changes
    - Add RLS policy to allow users to delete their own calendars
*/

-- Add policy for deleting calendars
CREATE POLICY "Users can delete own calendars"
  ON calendars
  FOR DELETE 
  USING (auth.uid() = user_id);