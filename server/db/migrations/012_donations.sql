CREATE TABLE IF NOT EXISTS donations (
  id SERIAL PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  locale TEXT DEFAULT 'de',
  currency TEXT DEFAULT 'eur',
  amount_total NUMERIC(10, 2),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS donations_created_at_idx
  ON donations (created_at DESC);