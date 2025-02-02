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

-- Drop existing materialized views
DROP MATERIALIZED VIEW IF EXISTS public_calendars;
DROP MATERIALIZED VIEW IF EXISTS user_subscriptions;

-- Simple, direct policies for profiles
CREATE POLICY "profiles_read"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- Users can read their own profile
    id = auth.uid()
    OR 
    -- Users can read profiles of public calendar creators
    EXISTS (
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
CREATE POLICY "calendars_read"
  ON calendars FOR SELECT
  USING (
    -- Public calendars are visible to all
    is_public = true
    OR
    -- Users can see their own calendars
    user_id = auth.uid()
    OR
    -- Users can see calendars they're subscribed to
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE calendar_id = calendars.id
      AND user_id = auth.uid()
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
CREATE POLICY "subscriptions_read"
  ON subscriptions FOR SELECT
  USING (
    -- Users can see their own subscriptions
    user_id = auth.uid()
    OR
    -- Calendar owners can see their subscribers
    EXISTS (
      SELECT 1 FROM calendars
      WHERE id = subscriptions.calendar_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "subscriptions_insert"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Users can only create subscriptions for themselves
    user_id = auth.uid()
    AND
    -- To calendars that are either public or their own
    EXISTS (
      SELECT 1 FROM calendars
      WHERE id = calendar_id
      AND (is_public = true OR user_id = auth.uid())
    )
  );

CREATE POLICY "subscriptions_delete"
  ON subscriptions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Simple policies for event feedback
CREATE POLICY "feedback_read"
  ON event_feedback FOR SELECT
  USING (
    -- Users can see their own feedback
    user_id = auth.uid()
    OR
    -- Calendar owners can see feedback on their calendars
    EXISTS (
      SELECT 1 FROM calendars
      WHERE id = event_feedback.calendar_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "feedback_insert"
  ON event_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Users can only create feedback for themselves
    user_id = auth.uid()
    AND
    -- Only on calendars they're subscribed to
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE calendar_id = event_feedback.calendar_id
      AND user_id = auth.uid()
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