-- Add policies for public access to calendars and profiles

-- Allow public access to public calendars
CREATE POLICY "Anyone can view public calendars"
  ON calendars
  FOR SELECT
  USING (is_public = true);

-- Allow public access to profile display names
CREATE POLICY "Anyone can view profile display names"
  ON profiles
  FOR SELECT
  USING (true);

-- Add policy for public subscriber count
CREATE POLICY "Anyone can view subscription counts"
  ON subscriptions
  FOR SELECT
  USING (true);

-- Update existing policies if needed
DO $$ 
BEGIN
  -- Drop any conflicting policies
  DROP POLICY IF EXISTS "Public calendars are viewable by everyone" ON calendars;
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
END $$;