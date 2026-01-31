ALTER TABLE news_articles
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'de';

ALTER TABLE media_tickets
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'de';

ALTER TABLE media_videos
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'de';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'news_articles_language_check'
  ) THEN
    ALTER TABLE news_articles
      ADD CONSTRAINT news_articles_language_check
      CHECK (language IN ('de', 'en', 'ku'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'media_tickets_language_check'
  ) THEN
    ALTER TABLE media_tickets
      ADD CONSTRAINT media_tickets_language_check
      CHECK (language IN ('de', 'en', 'ku'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'media_videos_language_check'
  ) THEN
    ALTER TABLE media_videos
      ADD CONSTRAINT media_videos_language_check
      CHECK (language IN ('de', 'en', 'ku'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS news_articles_language_idx ON news_articles (language);
CREATE INDEX IF NOT EXISTS media_tickets_language_idx ON media_tickets (language);
CREATE INDEX IF NOT EXISTS media_videos_language_idx ON media_videos (language);