-- Add pricing type to calendars
ALTER TABLE calendars
ADD COLUMN pricing_type text NOT NULL DEFAULT 'free' CHECK (pricing_type IN ('free', 'paid')),
ADD COLUMN price_cents integer CHECK (
  (pricing_type = 'free' AND price_cents IS NULL) OR
  (pricing_type = 'paid' AND price_cents >= 100) -- Minimum $1.00
),
ADD COLUMN stripe_account_id text,
ADD COLUMN stripe_product_id text;

-- Add index for faster queries
CREATE INDEX calendars_pricing_type_idx ON calendars(pricing_type);

-- Update RLS policies
CREATE POLICY "calendars_pricing_select_policy"
ON calendars FOR SELECT
USING (
  pricing_type = 'free' OR
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM subscriptions
    WHERE calendar_id = calendars.id
    AND user_id = auth.uid()
  )
);