-- Auth + newsletter tables

-- Users
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  has_online_ticket BOOLEAN NOT NULL DEFAULT false,
  newsletter_articles BOOLEAN NOT NULL DEFAULT false,
  newsletter_videos BOOLEAN NOT NULL DEFAULT false,
  newsletter_unsubscribe_key TEXT,
  registration_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  google_id TEXT UNIQUE,
  auth_provider TEXT NOT NULL DEFAULT 'local',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS users_auth_provider_idx ON users (auth_provider);

-- Newsletter subscriptions
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  newsletter_articles BOOLEAN NOT NULL DEFAULT false,
  newsletter_videos BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  newsletter_language TEXT NOT NULL DEFAULT 'de-DE',
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS newsletter_subscriptions_created_at_idx
  ON newsletter_subscriptions (created_at DESC);