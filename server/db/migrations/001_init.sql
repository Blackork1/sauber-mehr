-- DB init for DB-first EJS pages + schema.org generation support

-- 1) updated_at helper
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Global site settings (Organization + WebSite + Defaults)
--   - exactly one row is intended (id=1)
CREATE TABLE IF NOT EXISTS site_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),

  base_url TEXT NOT NULL,                 -- e.g. https://www.komplettwebdesign.de
  site_name TEXT NOT NULL,                -- Komplett Webdesign
  site_description TEXT,
  in_language TEXT NOT NULL DEFAULT 'de-DE',

  -- Store your JSON-LD as JSONB (one source of truth for org + website)
  organization_jsonld JSONB NOT NULL DEFAULT '{}'::jsonb,
  website_jsonld      JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- optional: defaults used to enrich pages automatically
  defaults JSONB NOT NULL DEFAULT '{
    "logo_url": null,
    "default_primary_image_url": null
  }'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON site_settings;
CREATE TRIGGER trg_site_settings_updated_at
BEFORE UPDATE ON site_settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- 3) Pages
CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,

  slug TEXT UNIQUE NOT NULL,               -- "home", "impressum", "webdesign-berlin"
  canonical_path TEXT NOT NULL,            -- "/" or "/impressum" or "/webdesign-berlin"
  title TEXT NOT NULL,

  meta_title TEXT,
  meta_description TEXT,

  -- Navigation & hierarchy (for BreadcrumbList + Menus)
  parent_id INT REFERENCES pages(id) ON DELETE SET NULL,
  nav BOOLEAN NOT NULL DEFAULT true,
  show_in_nav BOOLEAN NOT NULL DEFAULT true,
  nav_label TEXT,                          -- optional label (fallback: title)
  nav_order INT NOT NULL DEFAULT 0,
  display BOOLEAN NOT NULL DEFAULT true,

  -- Main content blocks (EJS components)
  content JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- SEO / schema enrichment per page
  primary_image JSONB NOT NULL DEFAULT '{
    "url": null,
    "width": null,
    "height": null,
    "alt": null
  }'::jsonb,

  related_links JSONB NOT NULL DEFAULT '[]'::jsonb,   -- array of absolute or relative URLs

  -- FAQ items for auto FAQPage schema (optional)
  -- structure: [{"q":"...","a":"<p>...</p>"}]
  faq_items JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Optional overrides / extra schema nodes for special pages
  -- e.g. {"webpage": {"@type":"ContactPage"}, "noindex": true}
  schema_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_pages_updated_at ON pages;
CREATE TRIGGER trg_pages_updated_at
BEFORE UPDATE ON pages
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS pages_display_idx ON pages (display);
CREATE INDEX IF NOT EXISTS pages_parent_id_idx ON pages (parent_id);
CREATE INDEX IF NOT EXISTS pages_nav_order_idx ON pages (nav_order);


-- 4) Industries (unchanged)
CREATE TABLE IF NOT EXISTS industries (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

-- 5) Contact requests (unchanged)
CREATE TABLE IF NOT EXISTS contact_requests (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6) Access logs (unchanged)
CREATE TABLE IF NOT EXISTS access_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  ip TEXT,
  ip_raw TEXT,
  cf_country TEXT,
  city TEXT,
  region TEXT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,

  method TEXT,
  path TEXT,
  status INT,
  referrer TEXT,
  ua TEXT,
  ua_name TEXT,
  ua_version TEXT,
  os_name TEXT,
  device_type TEXT,

  lang TEXT,
  rt_ms INT,
  bytes_sent INT,
  cf_ray TEXT,
  scheme TEXT,
  host TEXT
);

CREATE INDEX IF NOT EXISTS access_logs_created_at_idx ON access_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS access_logs_path_idx ON access_logs (path);


-- Optional: Per-page additional JSON-LD nodes (advanced, if needed later)
-- Example use: add Service / OfferCatalog / Article / Product nodes per page, without new columns.
CREATE TABLE IF NOT EXISTS page_schema_nodes (
  id BIGSERIAL PRIMARY KEY,
  page_id INT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  node_type TEXT,                          -- optional (e.g. "Service", "OfferCatalog")
  node JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS page_schema_nodes_page_id_idx ON page_schema_nodes (page_id, sort_order);

-- 7) Gallery media
CREATE TABLE IF NOT EXISTS gallery_images (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT,
  local_path TEXT,
  cloudinary_url TEXT,
  cloudinary_public_id TEXT,
  width INT,
  height INT,
  size_bytes INT,
  alt_de TEXT,
  alt_en TEXT,
  show_in_gallery BOOLEAN NOT NULL DEFAULT true,
  gallery_category TEXT NOT NULL DEFAULT 'moments',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gallery_videos (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT,
  local_path TEXT,
  cloudinary_url TEXT,
  cloudinary_public_id TEXT,
  width INT,
  height INT,
  size_bytes INT,
  alt_de TEXT,
  alt_en TEXT,
  show_in_gallery BOOLEAN NOT NULL DEFAULT true,
  gallery_category TEXT NOT NULL DEFAULT 'moments',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'de-DE',
  ADD COLUMN IF NOT EXISTS i18n_group TEXT;

CREATE INDEX IF NOT EXISTS pages_i18n_group_idx ON pages (i18n_group);