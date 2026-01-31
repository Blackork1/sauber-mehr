CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  wants_news BOOLEAN NOT NULL DEFAULT false,
  wants_video BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  language TEXT NOT NULL DEFAULT 'de-DE',
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS newsletter_subscriptions_email_idx
  ON newsletter_subscriptions (email);

CREATE INDEX IF NOT EXISTS newsletter_subscriptions_active_idx
  ON newsletter_subscriptions (active);