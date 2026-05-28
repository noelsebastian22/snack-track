-- Stripe columns for orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'confirmed', 'failed', 'refunded'));

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stripe_session_id text;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS verification_code text;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- RLS policies for Stripe/webhook access
DROP POLICY IF EXISTS "stripe_webhook_insert" ON orders;
CREATE POLICY "stripe_webhook_insert" ON orders
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "stripe_webhook_update" ON orders;
CREATE POLICY "stripe_webhook_update" ON orders
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- waba_sessions: stores Twilio WhatsApp conversation state per phone number
CREATE TABLE IF NOT EXISTS waba_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text UNIQUE NOT NULL,
  state text NOT NULL DEFAULT 'idle',
  cart jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for waba_sessions (managed by service role)
CREATE POLICY "waba_sessions_service_role_insert" ON waba_sessions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "waba_sessions_service_role_select" ON waba_sessions
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "waba_sessions_service_role_update" ON waba_sessions
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_waba_sessions_updated_at ON waba_sessions;
CREATE TRIGGER update_waba_sessions_updated_at
  BEFORE UPDATE ON waba_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
