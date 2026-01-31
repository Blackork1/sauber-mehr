CREATE TABLE IF NOT EXISTS media_videos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  duration TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_videos_category_idx ON media_videos (category);
CREATE INDEX IF NOT EXISTS media_videos_published_at_idx ON media_videos (published_at DESC);

DROP TRIGGER IF EXISTS trg_media_videos_updated_at ON media_videos;
CREATE TRIGGER trg_media_videos_updated_at
BEFORE UPDATE ON media_videos
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

ALTER TABLE media_videos
  ADD COLUMN IF NOT EXISTS description_short TEXT,
  ADD COLUMN IF NOT EXISTS other_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS regie TEXT,
  ADD COLUMN IF NOT EXISTS production TEXT,
  ADD COLUMN IF NOT EXISTS languages TEXT[] NOT NULL DEFAULT ARRAY[]::text[];