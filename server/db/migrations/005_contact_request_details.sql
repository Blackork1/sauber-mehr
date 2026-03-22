ALTER TABLE contact_requests
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE contact_requests
  ADD COLUMN IF NOT EXISTS contact_method TEXT;

ALTER TABLE contact_requests
  ADD COLUMN IF NOT EXISTS area TEXT;

ALTER TABLE contact_requests
  ADD COLUMN IF NOT EXISTS industry TEXT;

ALTER TABLE contact_requests
  ADD COLUMN IF NOT EXISTS other_details TEXT;