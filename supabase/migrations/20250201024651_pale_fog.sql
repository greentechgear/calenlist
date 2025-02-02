/*
  # Fix Profile Creation Issues

  1. Changes
    - Improve profile creation trigger reliability
    - Add proper error handling
    - Ensure profile exists before calendar operations
    - Fix foreign key constraint issues

  2. Security
    - Maintain proper access control
    - Handle edge cases safely
*/

-- Drop and recreate profile handler with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Create profile with proper error handling
  BEGIN
    INSERT INTO profiles (id, email, display_name)
    VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),  -- Handle null email case
      COALESCE(
        (NEW.raw_user_meta_data->>'display_name')::text,
        CASE 
          WHEN NEW.email IS NOT NULL THEN split_part(NEW.email, '@', 1)
          ELSE 'User ' || substr(NEW.id::text, 1, 8)
        END
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger with AFTER INSERT
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create function to ensure profile exists
CREATE OR REPLACE FUNCTION ensure_profile_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to create profile if it doesn't exist
  INSERT INTO profiles (id, email, display_name)
  SELECT 
    auth.uid(),
    COALESCE(auth.jwt()->>'email', ''),
    COALESCE(
      (auth.jwt()->'user_metadata'->>'display_name')::text,
      CASE 
        WHEN auth.jwt()->>'email' IS NOT NULL THEN split_part(auth.jwt()->>'email', '@', 1)
        ELSE 'User ' || substr(auth.uid()::text, 1, 8)
      END
    )
  WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to ensure profile exists before calendar operations
DROP TRIGGER IF EXISTS ensure_profile_before_calendar ON calendars;
CREATE TRIGGER ensure_profile_before_calendar
  BEFORE INSERT ON calendars
  FOR EACH ROW
  EXECUTE FUNCTION ensure_profile_exists();

-- Add trigger to ensure profile exists before subscription operations
DROP TRIGGER IF EXISTS ensure_profile_before_subscription ON subscriptions;
CREATE TRIGGER ensure_profile_before_subscription
  BEFORE INSERT ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION ensure_profile_exists();

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');