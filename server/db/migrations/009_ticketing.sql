CREATE TABLE IF NOT EXISTS ticket_orders (
  id SERIAL PRIMARY KEY,
  ticket_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  kino_quantity INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'eur',
  amount_total NUMERIC(10, 2),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_order_attendees (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES ticket_orders(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  ticket_code TEXT UNIQUE,
  qr_code_data TEXT,
  pdf_sent BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ticket_order_attendees_order_idx
  ON ticket_order_attendees (order_id);

CREATE TABLE IF NOT EXISTS online_access_codes (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES ticket_orders(id) ON DELETE SET NULL,
  code TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  redeemed_at TIMESTAMPTZ,
  redeemed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS online_access_codes_email_idx
  ON online_access_codes (email);