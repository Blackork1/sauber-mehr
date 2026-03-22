ALTER TABLE gallery_images
  ADD COLUMN IF NOT EXISTS gallery_category TEXT NOT NULL DEFAULT 'moments';

ALTER TABLE gallery_videos
  ADD COLUMN IF NOT EXISTS gallery_category TEXT NOT NULL DEFAULT 'moments';