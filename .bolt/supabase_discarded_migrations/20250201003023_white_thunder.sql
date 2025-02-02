-- Drop all existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "profiles_read" ON profiles;
  DROP POLICY IF EXISTS "profiles_insert" ON profiles;
  DROP POLICY IF EXISTS "profiles_update" ON profiles;
  DROP POLICY IF EXISTS "calendars_read" ON calendars;
  DROP POLICY IF EXISTS "calendars_insert" ON calendars;
  DROP POLICY IF EXISTS "calendars_update" ON calendars;
  DROP POLICY IF EXISTS "calendars_delete" ON calendars;
  DROP POLICY IF EXISTS "subscriptions_read" ON subscriptions;
  DROP POLICY IF EXISTS "subscriptions_insert" ON subscriptions;
  DROP POLICY IF EXISTS "subscriptions_delete" ON subscriptions;
  DROP POLICY IF EXISTS "feedback_read" ON event_feedback;
  DROP POLICY IF EXISTS "feedback_insert" ON event_feedback;
  DROP POLICY IF EXISTS "feedback_update" ON event_feedback;
END $$;

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

-- Profiles policies
CREATE POLICY "allow_read_own_profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "allow_read_public_creator_profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM calendars
      WHERE user_id = profiles.id
      AND is_public = true
    )
  );

CREATE POLICY "allow_insert_own_profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "allow_update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Calendars policies
CREATE POLICY "allow_read_calendar"
  ON calendars FOR SELECT
  USING (has_calendar_access(id));

CREATE POLICY "allow_insert_calendar"
  ON calendars FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "allow_update_calendar"
  ON calendars FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "allow_delete_calendar"
  ON calendars FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Subscriptions policies
CREATE POLICY "allow_read_subscription"
  ON subscriptions FOR SELECT
  USING (
    user_id = auth.uid() OR
    owns_calendar(calendar_id)
  );

CREATE POLICY "allow_insert_subscription"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (
      EXISTS (
        SELECT 1 FROM calendars
        WHERE id = calendar_id
        AND (is_public = true OR user_id = auth.uid())
      )
    )
  );

CREATE POLICY "allow_delete_subscription"
  ON subscriptions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Event feedback policies
CREATE POLICY "allow_read_feedback"
  ON event_feedback FOR SELECT
  USING (
    user_id = auth.uid() OR
    owns_calendar(calendar_id)
  );

CREATE POLICY "allow_insert_feedback"
  ON event_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE calendar_id = event_feedback.calendar_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "allow_update_feedback"
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