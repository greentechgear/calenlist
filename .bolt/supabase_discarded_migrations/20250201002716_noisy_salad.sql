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

-- Create a materialized view for public calendars to avoid recursion
CREATE MATERIALIZED VIEW IF NOT EXISTS public_calendars AS
SELECT id, user_id
FROM calendars
WHERE is_public = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_public_calendars_id ON public_calendars(id);
CREATE INDEX IF NOT EXISTS idx_public_calendars_user_id ON public_calendars(user_id);

-- Create a materialized view for user subscriptions
CREATE MATERIALIZED VIEW IF NOT EXISTS user_subscriptions AS
SELECT DISTINCT user_id, calendar_id
FROM subscriptions;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_user_calendar 
ON user_subscriptions(user_id, calendar_id);

-- Create function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_calendar_views()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public_calendars;
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_subscriptions;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh views
DROP TRIGGER IF EXISTS refresh_views_calendars ON calendars;
CREATE TRIGGER refresh_views_calendars
  AFTER INSERT OR UPDATE OR DELETE ON calendars
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_calendar_views();

DROP TRIGGER IF EXISTS refresh_views_subscriptions ON subscriptions;
CREATE TRIGGER refresh_views_subscriptions
  AFTER INSERT OR UPDATE OR DELETE ON subscriptions
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_calendar_views();

-- Simple, non-recursive policies for profiles
CREATE POLICY "profiles_read"
  ON profiles FOR SELECT
  USING (
    id = auth.uid() OR -- Own profile
    id IN (SELECT user_id FROM public_calendars) -- Public calendar creators
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
    id IN (SELECT id FROM public_calendars) OR -- Public calendars
    user_id = auth.uid() OR -- Own calendars
    id IN (SELECT calendar_id FROM user_subscriptions WHERE user_id = auth.uid()) -- Subscribed calendars
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
    user_id = auth.uid() OR -- Own subscriptions
    calendar_id IN (SELECT id FROM calendars WHERE user_id = auth.uid()) -- Subscriptions to own calendars
  );

CREATE POLICY "subscriptions_insert"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (
      calendar_id IN (SELECT id FROM public_calendars) OR -- Public calendars
      calendar_id IN (SELECT id FROM calendars WHERE user_id = auth.uid()) -- Own calendars
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
    user_id = auth.uid() OR -- Own feedback
    calendar_id IN (SELECT id FROM calendars WHERE user_id = auth.uid()) -- Feedback on own calendars
  );

CREATE POLICY "feedback_insert"
  ON event_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    calendar_id IN (SELECT calendar_id FROM user_subscriptions WHERE user_id = auth.uid())
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
GRANT ALL ON TABLE public_calendars TO postgres, authenticated;
GRANT ALL ON TABLE user_subscriptions TO postgres, authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendars_user_id ON calendars(user_id);
CREATE INDEX IF NOT EXISTS idx_calendars_is_public ON calendars(is_public);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_calendar_id ON subscriptions(calendar_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_user_id ON event_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_calendar_id ON event_feedback(calendar_id);

-- Initial refresh of materialized views
REFRESH MATERIALIZED VIEW public_calendars;
REFRESH MATERIALIZED VIEW user_subscriptions;