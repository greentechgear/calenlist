-- Drop all existing policies for calendars
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "calendars_select" ON calendars;
  DROP POLICY IF EXISTS "calendars_insert" ON calendars;
  DROP POLICY IF EXISTS "calendars_update" ON calendars;
  DROP POLICY IF EXISTS "calendars_delete" ON calendars;
  DROP POLICY IF EXISTS "calendars_read" ON calendars;
  DROP POLICY IF EXISTS "allow_read_calendar" ON calendars;
  DROP POLICY IF EXISTS "allow_insert_calendar" ON calendars;
  DROP POLICY IF EXISTS "allow_update_calendar" ON calendars;
  DROP POLICY IF EXISTS "allow_delete_calendar" ON calendars;
END $$;

-- Create a view for public calendars to avoid recursion
CREATE OR REPLACE VIEW public_calendars AS
SELECT id, user_id, name, description, google_calendar_url, banner, category_id, 
       streaming_urls, custom_url, demo_video_url, physical_address, address_visibility,
       payment_type, subscription_price_cents, event_price_cents, created_at, updated_at
FROM calendars
WHERE is_public = true;

-- Create a view for user subscriptions
CREATE OR REPLACE VIEW user_subscriptions AS
SELECT DISTINCT user_id, calendar_id
FROM subscriptions;

-- Create simple, non-recursive policies for calendars
CREATE POLICY "calendars_select"
  ON calendars FOR SELECT
  USING (
    is_public = true OR -- Public calendars
    user_id = auth.uid() OR -- Own calendars
    id IN ( -- Subscribed calendars
      SELECT calendar_id 
      FROM user_subscriptions 
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

-- Grant necessary permissions
GRANT ALL ON TABLE calendars TO postgres, authenticated;
GRANT SELECT ON public_calendars TO postgres, authenticated;
GRANT SELECT ON user_subscriptions TO postgres, authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendars_user_id ON calendars(user_id);
CREATE INDEX IF NOT EXISTS idx_calendars_is_public ON calendars(is_public);

-- Create composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_calendars_user_public 
ON calendars(user_id, is_public);

-- Analyze tables to update statistics
ANALYZE calendars;