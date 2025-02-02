-- Add payment options to calendars
ALTER TABLE calendars
ADD COLUMN payment_type text CHECK (payment_type IN ('free', 'subscription', 'one_time')),
ADD COLUMN subscription_price_cents integer,
ADD COLUMN event_price_cents integer,
ADD COLUMN stripe_account_id text,
ADD COLUMN stripe_product_id text;

-- Add constraints
ALTER TABLE calendars
ADD CONSTRAINT valid_payment_config CHECK (
  (payment_type = 'free' AND subscription_price_cents IS NULL AND event_price_cents IS NULL) OR
  (payment_type = 'subscription' AND subscription_price_cents >= 100 AND event_price_cents IS NULL) OR
  (payment_type = 'one_time' AND event_price_cents >= 100 AND subscription_price_cents IS NULL)
);

-- Add index for faster queries
CREATE INDEX calendars_payment_type_idx ON calendars(payment_type);

-- Update RLS policies
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