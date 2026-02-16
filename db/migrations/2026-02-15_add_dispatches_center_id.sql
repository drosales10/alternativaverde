ALTER TABLE IF EXISTS dispatches
ADD COLUMN IF NOT EXISTS collection_center_id TEXT REFERENCES collection_centers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_dispatches_collection_center_id ON dispatches(collection_center_id);
