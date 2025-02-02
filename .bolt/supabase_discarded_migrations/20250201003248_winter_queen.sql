-- First drop any existing policies that might conflict
DO $$ 
BEGIN
  -- Drop all existing policies for profiles
  DROP POLICY IF EXISTS "profiles_select" ON profiles;
  DROP POLICY IF EXISTS "profiles_insert" ON profiles;
  DROP POLICY IF EXISTS "profiles_update" ON profiles;
  DROP POLICY IF EXISTS "profiles_read" ON profiles;
  DROP POLICY IF EXISTS "allow_read_own_profile" ON profiles;
  DROP POLICY IF EXISTS "allow_read_public_creator_profile" ON profiles;
  DROP POLICY IF EXISTS "allow_insert_own_profile" ON profiles;
  DROP POLICY IF EXISTS "allow_update_own_profile" ON profiles;
  DROP POLICY IF EXISTS "Anyone can create profiles" ON profiles;
  DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "System can create profiles" ON profiles;
END $$;

-- Create new, simplified policies for profiles
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR -- Own profile
    id IN ( -- Profile of a calendar creator
      SELECT DISTINCT user_id 
      FROM calendars 
      WHERE is_public = true
    )
  );

CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON TABLE profiles TO postgres, authenticated;

-- Analyze table to update statistics
ANALYZE profiles;