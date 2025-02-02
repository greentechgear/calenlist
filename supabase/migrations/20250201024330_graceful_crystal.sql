/*
  # Initial Database Schema

  1. Tables
    - profiles: User profiles
    - calendar_categories: Categories for calendars
    - calendars: Main calendar table
    - subscriptions: Calendar subscriptions
    - event_feedback: User feedback for events
    - signup_logs: Track user signups

  2. Types
    - payment_type: Type of payment for calendars
    - address_visibility: Visibility level for physical addresses

  3. Security
    - RLS enabled on all tables
    - Policies for authenticated and anonymous access
    - Helper functions for access control
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom Types
CREATE TYPE payment_type AS ENUM ('free', 'subscription', 'one_time');
CREATE TYPE address_visibility AS ENUM ('public', 'subscribers', 'private');

-- Profiles Table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text NOT NULL,
  first_name text,
  last_name text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Calendar Categories Table
CREATE TABLE calendar_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  color text NOT NULL,
  icon text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE calendar_categories ENABLE ROW LEVEL SECURITY;

-- Calendars Table
CREATE TABLE calendars (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  google_calendar_url text,
  streaming_urls jsonb,
  custom_url text,
  is_public boolean DEFAULT true NOT NULL,
  category_id uuid REFERENCES calendar_categories(id),
  banner jsonb,
  demo_video_url text,
  physical_address text,
  address_visibility address_visibility DEFAULT 'subscribers' NOT NULL,
  payment_type payment_type DEFAULT 'free' NOT NULL,
  subscription_price_cents integer CHECK (subscription_price_cents >= 0),
  event_price_cents integer CHECK (event_price_cents >= 0),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_payment_config CHECK (
    (payment_type = 'free' AND subscription_price_cents IS NULL AND event_price_cents IS NULL) OR
    (payment_type = 'subscription' AND subscription_price_cents IS NOT NULL AND event_price_cents IS NULL) OR
    (payment_type = 'one_time' AND event_price_cents IS NOT NULL AND subscription_price_cents IS NULL)
  )
);

ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;

-- Subscriptions Table
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  calendar_id uuid NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, calendar_id)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Event Feedback Table
CREATE TABLE event_feedback (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  calendar_id uuid NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  event_id text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, calendar_id, event_id)
);

ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;

-- Signup Logs Table
CREATE TABLE signup_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  error_message text,
  response_data jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE signup_logs ENABLE ROW LEVEL SECURITY;

-- Helper Functions
CREATE OR REPLACE FUNCTION can_access_calendar(calendar_id uuid)
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

CREATE OR REPLACE FUNCTION can_access_profile(profile_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN 
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM calendars
      WHERE user_id = profile_id
      AND is_public = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_calendars_updated_at
  BEFORE UPDATE ON calendars
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- RLS Policies

-- Profiles
CREATE POLICY "profiles_read_policy"
  ON profiles FOR SELECT
  USING (can_access_profile(id));

CREATE POLICY "profiles_insert_policy"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_policy"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Calendar Categories
CREATE POLICY "calendar_categories_read_policy"
  ON calendar_categories FOR SELECT
  TO authenticated
  USING (true);

-- Calendars
CREATE POLICY "calendars_read_policy"
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

CREATE POLICY "calendars_insert_policy"
  ON calendars FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "calendars_update_policy"
  ON calendars FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "calendars_delete_policy"
  ON calendars FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Subscriptions
CREATE POLICY "subscriptions_read_policy"
  ON subscriptions FOR SELECT
  USING (
    user_id = auth.uid() OR
    calendar_id IN (
      SELECT id FROM calendars 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "subscriptions_insert_policy"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    can_access_calendar(calendar_id)
  );

CREATE POLICY "subscriptions_delete_policy"
  ON subscriptions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Event Feedback
CREATE POLICY "event_feedback_read_policy"
  ON event_feedback FOR SELECT
  USING (
    user_id = auth.uid() OR
    calendar_id IN (
      SELECT id FROM calendars 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "event_feedback_insert_policy"
  ON event_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    can_access_calendar(calendar_id)
  );

CREATE POLICY "event_feedback_update_policy"
  ON event_feedback FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "event_feedback_delete_policy"
  ON event_feedback FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Signup Logs
CREATE POLICY "signup_logs_read_policy"
  ON signup_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "signup_logs_insert_policy"
  ON signup_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_calendars_user ON calendars(user_id);
CREATE INDEX idx_calendars_category ON calendars(category_id);
CREATE INDEX idx_calendars_access ON calendars(is_public, user_id);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_calendar ON subscriptions(calendar_id);
CREATE INDEX idx_event_feedback_user ON event_feedback(user_id);
CREATE INDEX idx_event_feedback_calendar ON event_feedback(calendar_id);
CREATE INDEX idx_signup_logs_user ON signup_logs(user_id);

-- Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Insert default categories
INSERT INTO calendar_categories (name, description, color, icon) VALUES
  ('Education', 'Educational events and workshops', '#4F46E5', 'graduation-cap'),
  ('Community', 'Community gatherings and meetups', '#059669', 'users'),
  ('Entertainment', 'Shows, performances, and entertainment', '#0891B2', 'music'),
  ('Business', 'Business and professional events', '#BE123C', 'briefcase'),
  ('Sports', 'Sports and fitness activities', '#D97706', 'dumbbell'),
  ('Technology', 'Tech events and conferences', '#9333EA', 'laptop'),
  ('Arts', 'Art exhibitions and cultural events', '#0369A1', 'palette'),
  ('Health', 'Health and wellness events', '#65A30D', 'heart-pulse');

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');