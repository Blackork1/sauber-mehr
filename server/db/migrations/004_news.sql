-- 7) News articles
CREATE TABLE IF NOT EXISTS news_articles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  meta_description TEXT,
  description_short TEXT,
  description_long TEXT,
  title_image_url TEXT,
  h2_title TEXT,
  article_text TEXT,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_news_articles_updated_at ON news_articles;
CREATE TRIGGER trg_news_articles_updated_at
BEFORE UPDATE ON news_articles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS news_articles_published_at_idx ON news_articles (published_at DESC);