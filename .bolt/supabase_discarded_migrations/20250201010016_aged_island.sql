-- Create base tables
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  google_calendar_url text,
  is_public boolean DEFAULT true,
  banner jsonb,
  category_id uuid,
  streaming_urls jsonb,
  custom_url text,
  demo_video_url text,
  physical_address text,
  address_visibility text DEFAULT 'private',
  payment_type text DEFAULT 'free',
  subscription_price_cents integer,
  event_price_cents integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  calendar_id uuid REFERENCES calendars(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, calendar_id)
);

CREATE TABLE IF NOT EXISTS event_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  calendar_id uuid REFERENCES calendars(id) ON DELETE CASCADE NOT NULL,
  event_id text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, calendar_id, event_id)
);

CREATE TABLE IF NOT EXISTS signup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  request_id text,
  trigger_success boolean DEFAULT false,
  error_message text,
  response_data jsonb,
  created_at timestamptz DEFAULT now()
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

-- Profiles policies
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

-- Calendars policies
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

-- Subscriptions policies
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

-- Event feedback policies
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

-- Signup logs policies
CREATE POLICY "anyone_can_insert_logs"
  ON signup_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "anyone_can_update_logs"
  ON signup_logs FOR UPDATE
  USING (true);

CREATE POLICY "admins_can_view_logs"
  ON signup_logs FOR SELECT
  USING (auth.jwt() ->> 'email' = 'slimhokie@gmail.com');

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE signup_logs ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON TABLE profiles TO postgres, authenticated;
GRANT ALL ON TABLE calendars TO postgres, authenticated;
GRANT ALL ON TABLE subscriptions TO postgres, authenticated;
GRANT ALL ON TABLE event_feedback TO postgres, authenticated;
GRANT ALL ON TABLE signup_logs TO postgres, authenticated, anon;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendars_user_id ON calendars(user_id);
CREATE INDEX IF NOT EXISTS idx_calendars_is_public ON calendars(is_public);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_calendar_id ON subscriptions(calendar_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_user_id ON event_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_calendar_id ON event_feedback(calendar_id);
CREATE INDEX IF NOT EXISTS idx_signup_logs_user_id ON signup_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_signup_logs_created_at ON signup_logs(created_at);

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
ANALYZE signup_logs;