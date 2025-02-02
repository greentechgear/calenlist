-- Drop all existing policies
DO $$ 
BEGIN
  -- Drop policies for profiles
  DROP POLICY IF EXISTS "profiles_read" ON profiles;
  DROP POLICY IF EXISTS "profiles_insert" ON profiles;
  DROP POLICY IF EXISTS "profiles_update" ON profiles;
  
  -- Drop policies for calendars
  DROP POLICY IF EXISTS "calendars_read" ON calendars;
  DROP POLICY IF EXISTS "calendars_insert" ON calendars;
  DROP POLICY IF EXISTS "calendars_update" ON calendars;
  DROP POLICY IF EXISTS "calendars_delete" ON calendars;
  
  -- Drop policies for subscriptions
  DROP POLICY IF EXISTS "subscriptions_read" ON subscriptions;
  DROP POLICY IF EXISTS "subscriptions_insert" ON subscriptions;
  DROP POLICY IF EXISTS "subscriptions_delete" ON subscriptions;
  
  -- Drop policies for event_feedback
  DROP POLICY IF EXISTS "feedback_read" ON event_feedback;
  DROP POLICY IF EXISTS "feedback_insert" ON event_feedback;
  DROP POLICY IF EXISTS "feedback_update" ON event_feedback;
END $$;

-- Create materialized view for public calendar creators
CREATE MATERIALIZED VIEW IF NOT EXISTS public_calendar_creators AS
SELECT DISTINCT user_id
FROM calendars
WHERE is_public = true;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_public_calendar_creators_user_id 
ON public_calendar_creators(user_id);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_public_calendar_creators()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public_calendar_creators;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh view when calendars change
DROP TRIGGER IF EXISTS refresh_public_calendar_creators_trigger ON calendars;
CREATE TRIGGER refresh_public_calendar_creators_trigger
AFTER INSERT OR UPDATE OR DELETE ON calendars
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_public_calendar_creators();

-- Profiles policies
CREATE POLICY "allow_public_reads_profiles"
  ON profiles FOR SELECT
  USING (
    id = auth.uid() OR -- Own profile
    id IN (SELECT user_id FROM public_calendar_creators) -- Public calendar creators
  );

CREATE POLICY "allow_self_insert_profiles"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "allow_self_update_profiles"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Calendars policies
CREATE POLICY "allow_reads_calendars"
  ON calendars FOR SELECT
  USING (
    is_public = true OR -- Public calendars
    user_id = auth.uid() -- Own calendars
  );

CREATE POLICY "allow_self_insert_calendars"
  ON calendars FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "allow_self_update_calendars"
  ON calendars FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "allow_self_delete_calendars"
  ON calendars FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Subscriptions policies
CREATE POLICY "allow_reads_subscriptions"
  ON subscriptions FOR SELECT
  USING (
    user_id = auth.uid() OR -- Own subscriptions
    calendar_id IN (SELECT id FROM calendars WHERE user_id = auth.uid()) -- Subscriptions to own calendars
  );

CREATE POLICY "allow_insert_subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    calendar_id IN (SELECT id FROM calendars WHERE is_public = true OR user_id = auth.uid())
  );

CREATE POLICY "allow_self_delete_subscriptions"
  ON subscriptions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Event feedback policies
CREATE POLICY "allow_reads_feedback"
  ON event_feedback FOR SELECT
  USING (
    user_id = auth.uid() OR -- Own feedback
    calendar_id IN (SELECT id FROM calendars WHERE user_id = auth.uid()) -- Feedback on own calendars
  );

CREATE POLICY "allow_insert_feedback"
  ON event_feedback FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "allow_self_update_feedback"
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
GRANT ALL ON TABLE public_calendar_creators TO postgres, authenticated;

-- Create or update indexes
CREATE INDEX IF NOT EXISTS idx_calendars_user_id ON calendars(user_id);
CREATE INDEX IF NOT EXISTS idx_calendars_is_public ON calendars(is_public);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_calendar_id ON subscriptions(calendar_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_user_id ON event_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_calendar_id ON event_feedback(calendar_id);

-- Refresh the materialized view initially
REFRESH MATERIALIZED VIEW public_calendar_creators;