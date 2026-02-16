-- Schema for Alternativa Verde tickets database (PostgreSQL)
-- Consolidated with all migrations
-- Run: psql -U <user> -d tickets -f db/schema.sql

-- Trigram extension for ILIKE searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Collection centers table
CREATE TABLE IF NOT EXISTS collection_centers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT,
  city TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Collection center members table
CREATE TABLE IF NOT EXISTS collection_center_members (
  id TEXT PRIMARY KEY,
  center_id TEXT NOT NULL REFERENCES collection_centers(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  cedula TEXT,
  phone TEXT,
  role TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Single-row app configuration table
CREATE TABLE IF NOT EXISTS app_configuration (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  collection_center_id TEXT REFERENCES collection_centers(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO app_configuration (id, collection_center_id, updated_at)
VALUES (1, NULL, now())
ON CONFLICT (id) DO NOTHING;

-- Generators table (clients)
CREATE TABLE IF NOT EXISTS generators (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rif TEXT,
  phone TEXT,
  address TEXT,
  sector TEXT,
  collection_mode TEXT,
  collection_center_id TEXT REFERENCES collection_centers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  plate TEXT NOT NULL UNIQUE,
  brand TEXT,
  model TEXT,
  owner TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  collection_center_id TEXT REFERENCES collection_centers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  date TEXT NOT NULL,
  generator_id TEXT NOT NULL REFERENCES generators(id) ON DELETE CASCADE,
  generator_name TEXT NOT NULL,
  material_type TEXT,
  quantity NUMERIC,
  material_state TEXT,
  collection_center_id TEXT REFERENCES collection_centers(id) ON DELETE SET NULL,
  collector_member_id TEXT REFERENCES collection_center_members(id) ON DELETE SET NULL,
  collector_name TEXT,
  vehicle_plate TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Dispatches (salidas) table
CREATE TABLE IF NOT EXISTS dispatches (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  description TEXT,
  presentation TEXT,
  dispatched_quantity NUMERIC,
  destination_name TEXT,
  destination_rif TEXT,
  destination_address TEXT,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_name TEXT,
  driver_id TEXT,
  minec_guide_number TEXT,
  collection_center_id TEXT REFERENCES collection_centers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Optional indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_tickets_generator_id ON tickets(generator_id);
CREATE INDEX IF NOT EXISTS idx_tickets_date ON tickets(date);

-- Recommended indexes for list/search performance
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generators_name ON generators(name);
CREATE INDEX IF NOT EXISTS idx_generators_collection_center_id ON generators(collection_center_id);
CREATE INDEX IF NOT EXISTS idx_tickets_collection_center_id ON tickets(collection_center_id);
CREATE INDEX IF NOT EXISTS idx_tickets_collector_member_id ON tickets(collector_member_id);
CREATE INDEX IF NOT EXISTS idx_collection_center_members_center_id ON collection_center_members(center_id);
CREATE INDEX IF NOT EXISTS idx_collection_centers_name ON collection_centers(name);
CREATE INDEX IF NOT EXISTS idx_dispatches_date ON dispatches(date);
CREATE INDEX IF NOT EXISTS idx_dispatches_vehicle_id ON dispatches(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_collection_center_id ON dispatches(collection_center_id);

-- Trigram indexes for ILIKE searches
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number_trgm ON tickets USING GIN (ticket_number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tickets_generator_name_trgm ON tickets USING GIN (generator_name gin_trgm_ops);

-- Vehicles indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_is_default ON vehicles(is_default);
CREATE INDEX IF NOT EXISTS idx_vehicles_collection_center_id ON vehicles(collection_center_id);
