-- Seed data for Alternativa Verde (sample subset). Adjust or extend as needed.
-- Run after creating database and schema:
-- psql -U <user> -d tickets -f db/seed.sql

-- Generators (sample)
INSERT INTO generators (id, name, rif, phone, address, sector)
VALUES
  ('gen_1', 'Restaurant El Gran Cacique', 'J-504708925-0', '0414-0000001', 'El Caimito, Puerto Ordaz', 'El Caimito'),
  ('gen_2', 'Club Caronoco', 'J-504708925-1', '0414-0000002', 'Campo C, Puerto Ordaz', 'Campo C'),
  ('gen_3', 'Aladyn', 'J-504708925-2', '0414-0000003', 'Alta Vista, Puerto Ordaz', 'Alta Vista')
ON CONFLICT (id) DO NOTHING;

-- Vehicles by center
INSERT INTO vehicles (id, plate, brand, model, owner, is_default, collection_center_id)
VALUES
  ('veh_1', 'A12BC3D', 'Toyota', 'Hilux', 'Alternativa Verde', true, NULL),
  ('veh_2', 'B41ZX9Q', 'Ford', 'Ranger', 'Alternativa Verde', false, NULL),
  ('veh_3', 'C22RT7K', 'Chevrolet', 'N300', 'Alternativa Verde', true, NULL)
ON CONFLICT (id) DO NOTHING;

-- Collection centers
INSERT INTO collection_centers (id, name, state, city, address, is_active)
VALUES
  ('cc_1', 'Centro de Acopio Puerto Ordaz', 'Bolívar', 'Puerto Ordaz', 'Zona Industrial Unare II', true),
  ('cc_2', 'Centro de Acopio Caracas', 'Distrito Capital', 'Caracas', 'Av. Intercomunal Petare', true)
ON CONFLICT (id) DO NOTHING;

-- Members by center
INSERT INTO collection_center_members (id, center_id, full_name, phone, role, is_active)
VALUES
  ('ccm_1', 'cc_1', 'Rafael Díaz', '0414-5550001', 'Recolector', true),
  ('ccm_2', 'cc_1', 'María González', '0414-5550002', 'Recolector', true),
  ('ccm_3', 'cc_2', 'Luis Hernández', '0412-5550003', 'Recolector', true)
ON CONFLICT (id) DO NOTHING;

-- App configuration (single row)
INSERT INTO app_configuration (id, collection_center_id, updated_at)
VALUES (1, 'cc_1', now())
ON CONFLICT (id) DO UPDATE SET collection_center_id = EXCLUDED.collection_center_id, updated_at = now();

-- Assign center references once centers exist
UPDATE generators SET collection_center_id = 'cc_1' WHERE id IN ('gen_1', 'gen_2');
UPDATE generators SET collection_center_id = 'cc_2' WHERE id = 'gen_3';
UPDATE vehicles SET collection_center_id = 'cc_1' WHERE id IN ('veh_1', 'veh_2');
UPDATE vehicles SET collection_center_id = 'cc_2' WHERE id = 'veh_3';

-- Tickets (sample)
INSERT INTO tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collection_center_id, collector_member_id, collector_name, vehicle_plate, created_at)
VALUES
  ('t_1', 'AV-BOL-2026-0001', '2/01/2026', 'gen_1', 'Restaurant El Gran Cacique', 'Aceite Vegetal Usado (AVU) - No Peligroso', 50, 'Bruto', 'cc_1', 'ccm_1', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_2', 'AV-BOL-2026-0002', '3/01/2026', 'gen_2', 'Club Caronoco', 'Aceite Vegetal Usado (AVU) - No Peligroso', 150, 'Bruto', 'cc_1', 'ccm_2', 'María González', 'B41ZX9Q', now()),
  ('t_3', 'AV-BOL-2026-0003', '9/01/2026', 'gen_3', 'Aladyn', 'Aceite Vegetal Usado (AVU) - No Peligroso', 330, 'Bruto', 'cc_2', 'ccm_3', 'Luis Hernández', 'C22RT7K', now())
ON CONFLICT (id) DO NOTHING;
