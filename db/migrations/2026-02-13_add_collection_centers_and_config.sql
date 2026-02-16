-- Incremental migration: collection centers, members, app configuration, and ticket references
-- Safe to run multiple times (idempotent where possible).

BEGIN;

-- 1) Collection centers
CREATE TABLE IF NOT EXISTS collection_centers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT,
  city TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2) Members per center
CREATE TABLE IF NOT EXISTS collection_center_members (
  id TEXT PRIMARY KEY,
  center_id TEXT NOT NULL REFERENCES collection_centers(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3) Single-row app configuration
CREATE TABLE IF NOT EXISTS app_configuration (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  collection_center_id TEXT REFERENCES collection_centers(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure singleton row exists
INSERT INTO app_configuration (id, collection_center_id, updated_at)
VALUES (1, NULL, now())
ON CONFLICT (id) DO NOTHING;

-- 4) Tickets compatibility columns for existing databases
ALTER TABLE IF EXISTS tickets
  ADD COLUMN IF NOT EXISTS collection_center_id TEXT;

ALTER TABLE IF EXISTS tickets
  ADD COLUMN IF NOT EXISTS collector_member_id TEXT;

-- 4.1) Generators and vehicles center association
ALTER TABLE IF EXISTS generators
  ADD COLUMN IF NOT EXISTS collection_center_id TEXT;

ALTER TABLE IF EXISTS vehicles
  ADD COLUMN IF NOT EXISTS collection_center_id TEXT;

-- 5) Add foreign keys only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tickets_collection_center_id_fkey'
  ) THEN
    ALTER TABLE tickets
      ADD CONSTRAINT tickets_collection_center_id_fkey
      FOREIGN KEY (collection_center_id)
      REFERENCES collection_centers(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tickets_collector_member_id_fkey'
  ) THEN
    ALTER TABLE tickets
      ADD CONSTRAINT tickets_collector_member_id_fkey
      FOREIGN KEY (collector_member_id)
      REFERENCES collection_center_members(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'generators_collection_center_id_fkey'
  ) THEN
    ALTER TABLE generators
      ADD CONSTRAINT generators_collection_center_id_fkey
      FOREIGN KEY (collection_center_id)
      REFERENCES collection_centers(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'vehicles_collection_center_id_fkey'
  ) THEN
    ALTER TABLE vehicles
      ADD CONSTRAINT vehicles_collection_center_id_fkey
      FOREIGN KEY (collection_center_id)
      REFERENCES collection_centers(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 6) Indexes
CREATE INDEX IF NOT EXISTS idx_collection_centers_name ON collection_centers(name);
CREATE INDEX IF NOT EXISTS idx_collection_center_members_center_id ON collection_center_members(center_id);
CREATE INDEX IF NOT EXISTS idx_tickets_collection_center_id ON tickets(collection_center_id);
CREATE INDEX IF NOT EXISTS idx_tickets_collector_member_id ON tickets(collector_member_id);
CREATE INDEX IF NOT EXISTS idx_generators_collection_center_id ON generators(collection_center_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_collection_center_id ON vehicles(collection_center_id);

COMMIT;
