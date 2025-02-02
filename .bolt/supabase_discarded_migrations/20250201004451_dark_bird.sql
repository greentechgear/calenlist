-- Drop all existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "profiles_select" ON profiles;
  DROP POLICY IF EXISTS "profiles_insert" ON profiles;
  DROP POLICY IF EXISTS "profiles_update" ON profiles;
  DROP POLICY IF EXISTS "calendars_select" ON calendars;
  DROP POLICY IF EXISTS "calendars_insert" ON calendars;
  DROP POLICY IF EXISTS "calendars_update" ON calendars;
  DROP POLICY IF EXISTS "calendars_delete" ON calendars;
  DROP POLICY IF EXISTS "subscriptions_select" ON subscriptions;
  DROP POLICY IF EXISTS "subscriptions_insert" ON subscriptions;
  DROP POLICY IF EXISTS "subscriptions_delete" ON subscriptions;
  DROP POLICY IF EXISTS "feedback_select" ON event_feedback;
  DROP POLICY IF EXISTS "feedback_insert" ON event_feedback;
  DROP POLICY IF EXISTS "feedback_update" ON event_feedback;
END $$;

-- Create base tables if they don't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create a function to check if a user has access to a calendar
CREATE OR REPLACE FUNCTION has_calendar_access(calendar_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM calendars c
    WHERE c.id = calendar_id
    AND (
      c.is_public = true OR
      c.user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM subscriptions s
        WHERE s.calendar_id = c.id
        AND s.user_id = auth.uid()
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a user owns a calendar
CREATE OR REPLACE FUNCTION owns_calendar(calendar_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM calendars
    WHERE id = calendar_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple, non-recursive policies for profiles
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR -- Own profile
    EXISTS ( -- Profile of a public calendar creator
      SELECT 1 FROM calendars
      WHERE calendars.user_id = profiles.id
      AND calendars.is_public = true
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

-- Simple policies for calendars
CREATE POLICY "calendars_select"
  ON calendars FOR SELECT
  USING (
    is_public = true OR
    user_id = auth.uid() OR
    id IN (
      SELECT calendar_id 
      FROM subscriptions 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "calendars_insert"
  ON calendars FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "calendars_update"
  ON calendars FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "calendars_delete"
  ON calendars FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Simple policies for subscriptions
CREATE POLICY "subscriptions_select"
  ON subscriptions FOR SELECT
  USING (
    user_id = auth.uid() OR
    calendar_id IN (
      SELECT id 
      FROM calendars 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "subscriptions_insert"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (
      calendar_id IN (SELECT id FROM calendars WHERE is_public = true) OR
      calendar_id IN (SELECT id FROM calendars WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "subscriptions_delete"
  ON subscriptions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Simple policies for event feedback
CREATE POLICY "feedback_select"
  ON event_feedback FOR SELECT
  USING (
    user_id = auth.uid() OR
    calendar_id IN (
      SELECT id 
      FROM calendars 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "feedback_insert"
  ON event_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    calendar_id IN (
      SELECT calendar_id 
      FROM subscriptions 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "feedback_update"
  ON event_feedback FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON TABLE profiles TO postgres, authenticated;
GRANT ALL ON TABLE calendars TO postgres, authenticated;
GRANT ALL ON TABLE subscriptions TO postgres, authenticated;
GRANT ALL ON TABLE event_feedback TO postgres, authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendars_user_id ON calendars(user_id);
CREATE INDEX IF NOT EXISTS idx_calendars_is_public ON calendars(is_public);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_calendar_id ON subscriptions(calendar_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_user_id ON event_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_calendar_id ON event_feedback(calendar_id);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_calendar 
ON subscriptions(user_id, calendar_id);

CREATE INDEX IF NOT EXISTS idx_calendars_user_public 
ON calendars(user_id, is_public);

-- Analyze tables to update statistics
ANALYZE profiles;
ANALYZE calendars;
ANALYZE subscriptions;
ANALYZE event_feedback;