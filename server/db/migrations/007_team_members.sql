CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  description TEXT,
  image_url TEXT,
  display BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS team_members_display_idx ON team_members (display);
CREATE INDEX IF NOT EXISTS team_members_sort_order_idx ON team_members (sort_order);

DROP TRIGGER IF EXISTS trg_team_members_updated_at ON team_members;
CREATE TRIGGER trg_team_members_updated_at
BEFORE UPDATE ON team_members
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();