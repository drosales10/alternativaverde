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
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dispatches_date ON dispatches(date);
CREATE INDEX IF NOT EXISTS idx_dispatches_vehicle_id ON dispatches(vehicle_id);
