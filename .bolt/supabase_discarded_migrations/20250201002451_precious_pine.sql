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

-- Create a materialized view for public calendar creators to avoid recursion
CREATE MATERIALIZED VIEW IF NOT EXISTS public_calendar_creators AS
SELECT DISTINCT user_id
FROM calendars
WHERE is_public = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_public_calendar_creators_user_id 
ON public_calendar_creators(user_id);

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_public_calendar_creators()
RETURNS trigger AS $$
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

-- Simple, non-recursive policies for profiles
CREATE POLICY "profiles_read"
  ON profiles FOR SELECT
  USING (
    id = auth.uid() OR -- Own profile
    id IN (SELECT user_id FROM public_calendar_creators) -- Public calendar creators
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
    id IN (SELECT calendar_id FROM subscriptions WHERE user_id = auth.uid())
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
      calendar_id IN (SELECT id FROM calendars WHERE is_public = true) OR
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
    calendar_id IN (SELECT calendar_id FROM subscriptions WHERE user_id = auth.uid())
  );

CREATE POLICY "feedback_update"
  ON event_feedback FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add ON CONFLICT clause to profiles table
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;

ALTER TABLE profiles
ADD CONSTRAINT profiles_pkey 
PRIMARY KEY (id);

-- Create function to safely create or update profile
CREATE OR REPLACE FUNCTION safely_create_profile(
  user_id uuid,
  user_email text,
  display_name text
) RETURNS void AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (user_id, user_email, display_name)
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Refresh materialized view
REFRESH MATERIALIZED VIEW public_calendar_creators;