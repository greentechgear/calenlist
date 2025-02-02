-- First drop any existing payment-related objects
DROP POLICY IF EXISTS "calendars_pricing_select_policy" ON calendars;
DROP POLICY IF EXISTS "calendars_payment_select_policy" ON calendars;
DROP INDEX IF EXISTS calendars_pricing_type_idx;
DROP INDEX IF EXISTS calendars_payment_type_idx;

-- Remove any existing payment columns to start fresh
ALTER TABLE calendars 
DROP COLUMN IF EXISTS pricing_type,
DROP COLUMN IF EXISTS price_cents,
DROP COLUMN IF EXISTS payment_type,
DROP COLUMN IF EXISTS subscription_price_cents,
DROP COLUMN IF EXISTS event_price_cents,
DROP COLUMN IF EXISTS stripe_account_id,
DROP COLUMN IF EXISTS stripe_product_id;

-- Drop existing constraints
ALTER TABLE calendars
DROP CONSTRAINT IF EXISTS valid_payment_config,
DROP CONSTRAINT IF EXISTS payment_type_check;

-- Add payment columns with proper defaults and constraints
ALTER TABLE calendars
ADD COLUMN payment_type text NOT NULL DEFAULT 'free',
ADD COLUMN subscription_price_cents integer,
ADD COLUMN event_price_cents integer,
ADD COLUMN stripe_account_id text,
ADD COLUMN stripe_product_id text;

-- Add constraints
ALTER TABLE calendars
ADD CONSTRAINT payment_type_check 
CHECK (payment_type IN ('free', 'subscription', 'one_time'));

ALTER TABLE calendars
ADD CONSTRAINT valid_payment_config CHECK (
  (payment_type = 'free' AND subscription_price_cents IS NULL AND event_price_cents IS NULL) OR
  (payment_type = 'subscription' AND subscription_price_cents >= 100 AND event_price_cents IS NULL) OR
  (payment_type = 'one_time' AND event_price_cents >= 100 AND subscription_price_cents IS NULL)
);

-- Add index for faster queries
CREATE INDEX calendars_payment_type_idx ON calendars(payment_type);

-- Add RLS policy for payment-related access
CREATE POLICY "calendars_payment_select_policy"
ON calendars FOR SELECT
USING (
  payment_type = 'free' OR
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM subscriptions
    WHERE calendar_id = calendars.id
    AND user_id = auth.uid()
  )
);

-- Grant necessary permissions
GRANT ALL ON calendars TO authenticated;
GRANT ALL ON calendars TO anon;