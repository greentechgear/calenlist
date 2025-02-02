-- Drop old migration artifacts if they exist
DROP INDEX IF EXISTS calendars_pricing_type_idx;
DROP INDEX IF EXISTS calendars_payment_type_idx;

-- Remove old columns if they exist
ALTER TABLE calendars
DROP COLUMN IF EXISTS pricing_type,
DROP COLUMN IF EXISTS price_cents;

-- Add payment columns
ALTER TABLE calendars
ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_price_cents integer,
ADD COLUMN IF NOT EXISTS event_price_cents integer,
ADD COLUMN IF NOT EXISTS stripe_account_id text,
ADD COLUMN IF NOT EXISTS stripe_product_id text;

-- Add constraints
ALTER TABLE calendars
DROP CONSTRAINT IF EXISTS valid_payment_config;

ALTER TABLE calendars
ADD CONSTRAINT valid_payment_config CHECK (
  (payment_type = 'free' AND subscription_price_cents IS NULL AND event_price_cents IS NULL) OR
  (payment_type = 'subscription' AND subscription_price_cents >= 100 AND event_price_cents IS NULL) OR
  (payment_type = 'one_time' AND event_price_cents >= 100 AND subscription_price_cents IS NULL)
);

-- Add payment type constraint
ALTER TABLE calendars
DROP CONSTRAINT IF EXISTS payment_type_check;

ALTER TABLE calendars
ADD CONSTRAINT payment_type_check 
CHECK (payment_type IN ('free', 'subscription', 'one_time'));

-- Add index for faster queries
DROP INDEX IF EXISTS calendars_payment_type_idx;
CREATE INDEX calendars_payment_type_idx ON calendars(payment_type);

-- Update RLS policies
DROP POLICY IF EXISTS "calendars_pricing_select_policy" ON calendars;
DROP POLICY IF EXISTS "calendars_payment_select_policy" ON calendars;

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