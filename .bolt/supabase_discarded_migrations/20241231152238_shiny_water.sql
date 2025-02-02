-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own calendars" ON calendars;
DROP POLICY IF EXISTS "Users can update own calendars" ON calendars;
DROP POLICY IF EXISTS "Anyone can view public calendars" ON calendars;
DROP POLICY IF EXISTS "Users can view subscribed private calendars" ON calendars;

-- Create comprehensive RLS policies
CREATE POLICY "calendars_insert_policy" 
ON calendars FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "calendars_select_policy" 
ON calendars FOR SELECT 
USING (
  is_public = true OR -- Public calendars visible to all
  auth.uid() = user_id OR -- Owner can see their calendars
  EXISTS ( -- Subscribers can see private calendars they're subscribed to
    SELECT 1 FROM subscriptions 
    WHERE calendar_id = calendars.id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "calendars_update_policy" 
ON calendars FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "calendars_delete_policy" 
ON calendars FOR DELETE 
USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;