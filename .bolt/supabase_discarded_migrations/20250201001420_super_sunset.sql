-- Drop all existing policies and views
DO $$ 
BEGIN
  -- Drop all existing policies
  DROP POLICY IF EXISTS "allow_public_reads_profiles" ON profiles;
  DROP POLICY IF EXISTS "allow_self_insert_profiles" ON profiles;
  DROP POLICY IF EXISTS "allow_self_update_profiles" ON profiles;
  DROP POLICY IF EXISTS "allow_reads_calendars" ON calendars;
  DROP POLICY IF EXISTS "allow_self_insert_calendars" ON calendars;
  DROP POLICY IF EXISTS "allow_self_update_calendars" ON calendars;
  DROP POLICY IF EXISTS "allow_self_delete_calendars" ON calendars;
  DROP POLICY IF EXISTS "allow_reads_subscriptions" ON subscriptions;
  DROP POLICY IF EXISTS "allow_insert_subscriptions" ON subscriptions;
  DROP POLICY IF EXISTS "allow_self_delete_subscriptions" ON subscriptions;
  DROP POLICY IF EXISTS "allow_reads_feedback" ON event_feedback;
  DROP POLICY IF EXISTS "allow_insert_feedback" ON event_feedback;
  DROP POLICY IF EXISTS "allow_self_update_feedback" ON event_feedback;

  -- Drop existing materialized views
  DROP MATERIALIZED VIEW IF EXISTS public_calendar_creators;
  DROP MATERIALIZED VIEW IF EXISTS calendar_subscribers;
END $$;

-- Create materialized views for better performance
CREATE MATERIALIZED VIEW public_calendars AS
SELECT id, user_id
FROM calendars
WHERE is_public = true;

CREATE UNIQUE INDEX idx_public_calendars_id ON public_calendars(id);
CREATE INDEX idx_public_calendars_user_id ON public_calendars(user_id);

CREATE MATERIALIZED VIEW user_subscriptions AS
SELECT DISTINCT user_id, calendar_id
FROM subscriptions;

CREATE UNIQUE INDEX idx_user_subscriptions_user_calendar ON user_subscriptions(user_id, calendar_id);

-- Create refresh functions
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public_calendars;
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_subscriptions;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for materialized view refresh
DROP TRIGGER IF EXISTS refresh_views_calendars ON calendars;
CREATE TRIGGER refresh_views_calendars
  AFTER INSERT OR UPDATE OR DELETE ON calendars
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_materialized_views();

DROP TRIGGER IF EXISTS refresh_views_subscriptions ON subscriptions;
CREATE TRIGGER refresh_views_subscriptions
  AFTER INSERT OR UPDATE OR DELETE ON subscriptions
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_materialized_views();

-- Simple, non-recursive policies for profiles
CREATE POLICY "profiles_read"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    id IN (SELECT user_id FROM public_calendars)
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
    is_public = true OR
    user_id = auth.uid() OR
    id IN (SELECT calendar_id FROM user_subscriptions WHERE user_id = auth.uid())
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
    user_id = auth.uid() OR
    calendar_id IN (SELECT id FROM calendars WHERE user_id = auth.uid())
  );

CREATE POLICY "subscriptions_insert"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (
      calendar_id IN (SELECT id FROM public_calendars) OR
      calendar_id IN (SELECT id FROM calendars WHERE user_id = auth.uid())
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
    user_id = auth.uid() OR
    calendar_id IN (SELECT id FROM calendars WHERE user_id = auth.uid())
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