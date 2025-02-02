/*
  # Empty Migration
  
  Previous seed data has been commented out for reference
*/

-- Temporarily disable the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

/*
-- First, create the personas with profiles
WITH persona_users AS (
  INSERT INTO auth.users (id, email, created_at)
  VALUES
    (uuid_generate_v4(), 'sarah@techconf.org', now()),
    (uuid_generate_v4(), 'mike@fitpro.com', now()),
    (uuid_generate_v4(), 'emma@careercoach.net', now()),
    (uuid_generate_v4(), 'david@communityorg.com', now()),
    (uuid_generate_v4(), 'alex@speakerpro.com', now()),
    (uuid_generate_v4(), 'lisa@workshoplab.com', now())
  RETURNING id, email
)
INSERT INTO profiles (id, email, display_name, first_name, last_name)
SELECT 
  id,
  email,
  CASE 
    WHEN email LIKE 'sarah%' THEN 'Sarah Chen'
    WHEN email LIKE 'mike%' THEN 'Mike Johnson'
    WHEN email LIKE 'emma%' THEN 'Emma Rodriguez'
    WHEN email LIKE 'david%' THEN 'David Park'
    WHEN email LIKE 'alex%' THEN 'Alex Thompson'
    ELSE 'Lisa Martinez'
  END as display_name,
  CASE 
    WHEN email LIKE 'sarah%' THEN 'Sarah'
    WHEN email LIKE 'mike%' THEN 'Mike'
    WHEN email LIKE 'emma%' THEN 'Emma'
    WHEN email LIKE 'david%' THEN 'David'
    WHEN email LIKE 'alex%' THEN 'Alex'
    ELSE 'Lisa'
  END as first_name,
  CASE 
    WHEN email LIKE 'sarah%' THEN 'Chen'
    WHEN email LIKE 'mike%' THEN 'Johnson'
    WHEN email LIKE 'emma%' THEN 'Rodriguez'
    WHEN email LIKE 'david%' THEN 'Park'
    WHEN email LIKE 'alex%' THEN 'Thompson'
    ELSE 'Martinez'
  END as last_name
FROM persona_users;

-- Create their calendars
WITH persona_profiles AS (
  SELECT id, email FROM profiles WHERE email IN (
    'sarah@techconf.org',
    'mike@fitpro.com',
    'emma@careercoach.net',
    'david@communityorg.com',
    'alex@speakerpro.com',
    'lisa@workshoplab.com'
  )
)
INSERT INTO calendars (id, user_id, name, description, google_calendar_url, category_id, is_public, banner, streaming_urls)
SELECT
  uuid_generate_v4(),
  profiles.id,
  CASE 
    WHEN profiles.email LIKE 'sarah%' THEN 'TechConf 2024 Schedule'
    WHEN profiles.email LIKE 'mike%' THEN 'Fitness Classes with Mike'
    WHEN profiles.email LIKE 'emma%' THEN 'Career Development Sessions'
    WHEN profiles.email LIKE 'david%' THEN 'Community Events Calendar'
    WHEN profiles.email LIKE 'alex%' THEN 'Tech Talks with Alex'
    ELSE 'Creative Workshop Series'
  END as name,
  CASE 
    WHEN profiles.email LIKE 'sarah%' THEN 'Official calendar for TechConf 2024 - Join us for cutting-edge tech talks and workshops'
    WHEN profiles.email LIKE 'mike%' THEN 'Weekly fitness classes and personal training sessions'
    WHEN profiles.email LIKE 'emma%' THEN 'One-on-one career coaching and group workshops'
    WHEN profiles.email LIKE 'david%' THEN 'Local community events and meetups'
    WHEN profiles.email LIKE 'alex%' THEN 'Professional speaking engagements and tech presentations'
    ELSE 'Interactive workshops on design thinking and innovation'
  END as description,
  CASE 
    WHEN profiles.email LIKE 'sarah%' THEN 'techconf2024@group.calendar.google.com'
    WHEN profiles.email LIKE 'mike%' THEN 'mikefitness@group.calendar.google.com'
    WHEN profiles.email LIKE 'emma%' THEN 'emmacareer@group.calendar.google.com'
    WHEN profiles.email LIKE 'david%' THEN 'communityevents@group.calendar.google.com'
    WHEN profiles.email LIKE 'alex%' THEN 'alextalks@group.calendar.google.com'
    ELSE 'lisaworkshops@group.calendar.google.com'
  END as google_calendar_url,
  CASE 
    WHEN profiles.email LIKE 'sarah%' THEN '9b5e9d6a-0d8f-4c8a-9e4e-6d8f3b7c5a2e'
    WHEN profiles.email LIKE 'mike%' THEN 'c2e3a26e-fd0e-4d43-b930-2b1c8c5fd1b1'
    WHEN profiles.email LIKE 'emma%' THEN '8a9d6a4f-6d77-4c5c-9de9-9e6e9520cb6a'
    WHEN profiles.email LIKE 'david%' THEN 'e4d97cf3-43fb-4185-9d34-e50d7c0b8985'
    WHEN profiles.email LIKE 'alex%' THEN '9b5e9d6a-0d8f-4c8a-9e4e-6d8f3b7c5a2e'
    ELSE 'c2e3a26e-fd0e-4d43-b930-2b1c8c5fd1b1'
  END::uuid as category_id,
  true as is_public,
  CASE 
    WHEN profiles.email LIKE 'sarah%' THEN '{"id":"indigo","name":"Indigo Waves","color":"#EEF2FF","textColor":"#4F46E5","pattern":"waves"}'
    WHEN profiles.email LIKE 'mike%' THEN '{"id":"emerald","name":"Emerald Dots","color":"#ECFDF5","textColor":"#059669","pattern":"dots"}'
    WHEN profiles.email LIKE 'emma%' THEN '{"id":"ocean","name":"Ocean Breeze","color":"#F0FDFF","textColor":"#0891B2","pattern":"lines"}'
    WHEN profiles.email LIKE 'david%' THEN '{"id":"rose","name":"Rose Garden","color":"#FFF1F2","textColor":"#BE123C","pattern":"dots"}'
    WHEN profiles.email LIKE 'alex%' THEN '{"id":"violet","name":"Violet Night","color":"#F5F3FF","textColor":"#7C3AED","pattern":"lines"}'
    ELSE '{"id":"amber","name":"Amber Sunset","color":"#FFFBEB","textColor":"#D97706","pattern":"waves"}'
  END::jsonb as banner,
  CASE 
    WHEN profiles.email LIKE 'sarah%' THEN '{"Twitch": "https://twitch.tv/techconf2024", "YouTube": "https://youtube.com/techconf"}'
    WHEN profiles.email LIKE 'mike%' THEN '{"YouTube": "https://youtube.com/mikefitness"}'
    WHEN profiles.email LIKE 'emma%' THEN '{}'
    WHEN profiles.email LIKE 'david%' THEN '{"Twitch": "https://twitch.tv/communityorg"}'
    WHEN profiles.email LIKE 'alex%' THEN '{"YouTube": "https://youtube.com/alextalks"}'
    ELSE '{"Twitch": "https://twitch.tv/creativeworkshops"}'
  END::jsonb as streaming_urls
FROM persona_profiles profiles;

-- Create random subscribers (about 300)
WITH RECURSIVE numbers AS (
  SELECT 1 as n
  UNION ALL
  SELECT n + 1 FROM numbers WHERE n < 300
),
random_users AS (
  INSERT INTO auth.users (id, email, created_at)
  SELECT 
    uuid_generate_v4(),
    'user' || n || '@example.com',
    now() - (random() * interval '60 days')
  FROM numbers
  RETURNING id, email, created_at
)
INSERT INTO profiles (id, email, display_name)
SELECT 
  id,
  email,
  'Subscriber ' || row_number() over (order by random_users.created_at)
FROM random_users;

-- Create random subscriptions
INSERT INTO subscriptions (user_id, calendar_id)
SELECT DISTINCT
  p.id,
  c.id
FROM profiles p
CROSS JOIN calendars c
WHERE p.email LIKE 'user%@example.com'
AND random() < 0.2;

-- Refresh the calendar stats
REFRESH MATERIALIZED VIEW calendar_stats;
*/

-- Re-create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();