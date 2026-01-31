CREATE TABLE IF NOT EXISTS sponsors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_sponsors_updated_at ON sponsors;
CREATE TRIGGER trg_sponsors_updated_at
BEFORE UPDATE ON sponsors
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

ALTER TABLE sponsors
ADD COLUMN IF NOT EXISTS link_url TEXT;