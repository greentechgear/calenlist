/*
  # Initial Schema for Calendar Sharing Network

  1. New Tables
    - `profiles`
      - Extends auth.users with additional profile information
      - Stores user display name and avatar
    
    - `calendars`
      - Stores calendar information
      - Links to Google Calendar URLs
      - Includes metadata like title and visibility settings
    
    - `subscriptions`
      - Manages user subscriptions to calendars
      - Tracks subscription date and status

  2. Security
    - Enable RLS on all tables
    - Add policies for secure access control
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create calendars table
CREATE TABLE IF NOT EXISTS calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  google_calendar_url text NOT NULL,
  twitch_url text,
  youtube_url text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  calendar_id uuid REFERENCES calendars(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, calendar_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Calendars policies
CREATE POLICY "Public calendars are viewable by everyone"
  ON calendars FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view subscribed private calendars"
  ON calendars FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE calendar_id = calendars.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own calendars"
  ON calendars FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendars"
  ON calendars FOR UPDATE
  USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can subscribe to calendars"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsubscribe"
  ON subscriptions FOR DELETE
  USING (auth.uid() = user_id);