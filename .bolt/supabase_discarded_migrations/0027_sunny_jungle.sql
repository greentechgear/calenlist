-- Clean up persona data
DO $$ 
BEGIN
  -- Delete subscriptions for test users
  DELETE FROM subscriptions
  WHERE user_id IN (
    SELECT id FROM profiles 
    WHERE email LIKE 'user%@example.com'
    OR email IN (
      'sarah@techconf.org',
      'mike@fitpro.com',
      'emma@careercoach.net',
      'david@communityorg.com',
      'alex@speakerpro.com',
      'lisa@workshoplab.com'
    )
  );

  -- Delete calendars for persona users
  DELETE FROM calendars
  WHERE user_id IN (
    SELECT id FROM profiles 
    WHERE email IN (
      'sarah@techconf.org',
      'mike@fitpro.com',
      'emma@careercoach.net',
      'david@communityorg.com',
      'alex@speakerpro.com',
      'lisa@workshoplab.com'
    )
  );

  -- Delete test user profiles
  DELETE FROM profiles
  WHERE email LIKE 'user%@example.com'
  OR email IN (
    'sarah@techconf.org',
    'mike@fitpro.com',
    'emma@careercoach.net',
    'david@communityorg.com',
    'alex@speakerpro.com',
    'lisa@workshoplab.com'
  );

  -- Delete test users from auth.users
  DELETE FROM auth.users
  WHERE email LIKE 'user%@example.com'
  OR email IN (
    'sarah@techconf.org',
    'mike@fitpro.com',
    'emma@careercoach.net',
    'david@communityorg.com',
    'alex@speakerpro.com',
    'lisa@workshoplab.com'
  );

  -- Refresh the calendar stats
  REFRESH MATERIALIZED VIEW calendar_stats;
END $$;