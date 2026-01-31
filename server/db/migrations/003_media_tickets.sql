-- Ticket data for media tickets section

CREATE TABLE IF NOT EXISTS media_tickets (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  ticket_type TEXT NOT NULL,
  title TEXT NOT NULL,
  ticket_text TEXT,
  badge_text TEXT,
  badge_bg_color TEXT,
  badge_text_color TEXT,
  hint_text TEXT,
  button_label TEXT,
  button_url TEXT,
  event_price NUMERIC(10, 2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_media_tickets_updated_at ON media_tickets;
CREATE TRIGGER trg_media_tickets_updated_at
BEFORE UPDATE ON media_tickets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS media_ticket_features (
  id SERIAL PRIMARY KEY,
  ticket_id INT NOT NULL REFERENCES media_tickets(id) ON DELETE CASCADE,
  feature_text TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS media_ticket_features_ticket_id_idx
  ON media_ticket_features (ticket_id, sort_order);

CREATE TABLE IF NOT EXISTS media_ticket_price_phases (
  id SERIAL PRIMARY KEY,
  ticket_id INT NOT NULL REFERENCES media_tickets(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  start_at DATE,
  end_at DATE,
  current_price NUMERIC(10, 2) NOT NULL,
  price_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ticket_id, phase)
);

DROP TRIGGER IF EXISTS trg_media_ticket_price_phases_updated_at ON media_ticket_price_phases;
CREATE TRIGGER trg_media_ticket_price_phases_updated_at
BEFORE UPDATE ON media_ticket_price_phases
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS media_ticket_price_phases_ticket_id_idx
  ON media_ticket_price_phases (ticket_id, start_at);