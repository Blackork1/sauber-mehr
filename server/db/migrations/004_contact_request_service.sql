ALTER TABLE contact_requests
  ADD COLUMN IF NOT EXISTS service TEXT;

  ALTER TABLE contact_requests
  ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;