CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  google_id TEXT,
  auth_provider TEXT DEFAULT 'local',
  newsletter_articles BOOLEAN DEFAULT FALSE,
  newsletter_videos BOOLEAN DEFAULT FALSE,
  newsletter_unsubscribe_key TEXT,
  registration_data JSONB,
  has_online_ticket BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx
  ON users (email);