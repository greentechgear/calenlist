-- Drop all existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "allow_read_own_profile" ON profiles;
  DROP POLICY IF EXISTS "allow_read_public_creator_profile" ON profiles;
  DROP POLICY IF EXISTS "allow_insert_own_profile" ON profiles;
  DROP POLICY IF EXISTS "allow_update_own_profile" ON profiles;
  DROP POLICY IF EXISTS "allow_read_calendar" ON calendars;
  DROP POLICY IF EXISTS "allow_insert_calendar" ON calendars;
  DROP POLICY IF EXISTS "allow_update_calendar" ON calendars;
  DROP POLICY IF EXISTS "allow_delete_calendar" ON calendars;
  DROP POLICY IF EXISTS "allow_read_subscription" ON subscriptions;
  DROP POLICY IF EXISTS "allow_insert_subscription" ON subscriptions;
  DROP POLICY IF EXISTS "allow_delete_subscription" ON subscriptions;
  DROP POLICY IF EXISTS "allow_read_feedback" ON event_feedback;
  DROP POLICY IF EXISTS "allow_insert_feedback" ON event_feedback;
  DROP POLICY IF EXISTS "allow_update_feedback" ON event_feedback;
END $$;

-- Simplified profiles policies
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

-- Simplified calendars policies
CREATE POLICY "calendars_select"
  ON calendars FOR SELECT
  USING (
    is_public = true OR -- Public calendars
    user_id = auth.uid() OR -- Own calendars
    id IN ( -- Subscribed calendars
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

-- Simplified subscriptions policies
CREATE POLICY "subscriptions_select"
  ON subscriptions FOR SELECT
  USING (
    user_id = auth.uid() OR -- Own subscriptions
    calendar_id IN ( -- Subscriptions to own calendars
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
      calendar_id IN ( -- Public calendars
        SELECT id 
        FROM calendars 
        WHERE is_public = true
      ) OR
      calendar_id IN ( -- Own calendars
        SELECT id 
        FROM calendars 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "subscriptions_delete"
  ON subscriptions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Simplified event feedback policies
CREATE POLICY "feedback_select"
  ON event_feedback FOR SELECT
  USING (
    user_id = auth.uid() OR -- Own feedback
    calendar_id IN ( -- Feedback on own calendars
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
    calendar_id IN ( -- Only for subscribed calendars
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