-- Full seed generated from constants.tsx RAW_SEED_DATA
-- Run with: psql -U <user> -d tickets -f db/seed_all.sql

-- Generators (unique)
INSERT INTO generators (id, name, rif, phone, address, sector)
VALUES
  ('gen_1', 'Restaurant El Gran Cacique', 'J-504708925-1', '0414-0000001', 'El Caimito, Puerto Ordaz', 'El Caimito'),
  ('gen_2', 'Club Caronoco', 'J-504708925-2', '0414-0000002', 'Campo C, Puerto Ordaz', 'Campo C'),
  ('gen_3', 'Aladyn', 'J-504708925-3', '0414-0000003', 'Alta Vista, Puerto Ordaz', 'Alta Vista'),
  ('gen_4', 'Palace Cantó', 'J-504708925-4', '0414-0000004', 'C.C. Costa Granada, Puerto Ordaz', 'C.C. Costa Granada'),
  ('gen_5', 'Pollos Rys', 'J-504708925-5', '0414-0000005', 'Unare I, Puerto Ordaz', 'Unare I'),
  ('gen_6', 'Chido Pizzas', 'J-504708925-6', '0414-0000006', 'C.C. Alta Vista II, Puerto Ordaz', 'C.C. Alta Vista II'),
  ('gen_7', 'Roof Burger', 'J-504708925-7', '0414-0000007', 'Calle Hambre, Puerto Ordaz', 'Calle Hambre'),
  ('gen_8', 'F. Jaimes', 'J-504708925-8', '0414-0000008', 'Av. Atlántica, Puerto Ordaz', 'Av. Atlántica'),
  ('gen_9', 'Dores Puerto Ordaz', 'J-504708925-9', '0414-0000009', 'Alta Vista, Puerto Ordaz', 'Alta Vista'),
  ('gen_10', 'Phoenix Asian Fast Food', 'J-504708925-10', '0414-0000010', 'Redoma La Piña, Puerto Ordaz', 'Redoma La Piña'),
  ('gen_11', 'Pollos Milus', 'J-504708925-11', '0414-0000011', 'C.C. Alta Vista 2, Puerto Ordaz', 'C.C. Alta Vista 2'),
  ('gen_12', 'Restaurant El Yaque', 'J-504708925-12', '0414-0000012', 'Club Italo, Puerto Ordaz', 'Club Italo'),
  ('gen_13', 'D''oro Pizza', 'J-504708925-13', '0414-0000013', 'Alta Vista, Puerto Ordaz', 'Alta Vista'),
  ('gen_14', 'Buffalo Bill PZO', 'J-504708925-14', '0414-0000014', 'C.C. Alta Vista I, Puerto Ordaz', 'C.C. Alta Vista I'),
  ('gen_15', 'Club Campestre Pesca y Paga', 'J-504708925-15', '0414-0000015', 'El Caimito, Puerto Ordaz', 'El Caimito'),
  ('gen_16', 'Panadería La Bodega', 'J-504708925-16', '0414-0000016', 'Alta Vista, Puerto Ordaz', 'Alta Vista'),
  ('gen_17', 'Pollo Portu''s', 'J-504708925-17', '0414-0000017', 'Unare I, Puerto Ordaz', 'Unare I'),
  ('gen_18', 'Porkis 286', 'J-504708925-18', '0414-0000018', 'Unare I, Puerto Ordaz', 'Unare I'),
  ('gen_19', 'Pollos Daniels', 'J-504708925-19', '0414-0000019', 'Unare I, Puerto Ordaz', 'Unare I'),
  ('gen_20', 'Chicken King 1990', 'J-504708925-20', '0414-0000020', 'C.C. Alta Vista II, Puerto Ordaz', 'C.C. Alta Vista II'),
  ('gen_21', 'Daniel Devera', 'J-504708925-21', '0414-0000021', 'Los Olivos, Puerto Ordaz', 'Los Olivos'),
  ('gen_22', 'Chimuelo Burger', 'J-504708925-22', '0414-0000022', 'Torre Movistar, Puerto Ordaz', 'Torre Movistar'),
  ('gen_23', 'King Kebab', 'J-504708925-23', '0414-0000023', 'Río Negro, Puerto Ordaz', 'Río Negro')
ON CONFLICT (id) DO NOTHING;

-- Collection centers
INSERT INTO collection_centers (id, name, state, city, address, is_active)
VALUES
  ('cc_1', 'Centro de Acopio Puerto Ordaz', 'Bolívar', 'Puerto Ordaz', 'Zona Industrial Unare II', true),
  ('cc_2', 'Centro de Acopio Caracas', 'Distrito Capital', 'Caracas', 'Av. Intercomunal Petare', true),
  ('cc_3', 'Centro de Acopio Valencia', 'Carabobo', 'Valencia', 'Av. Bolívar Norte', true)
ON CONFLICT (id) DO NOTHING;

-- Members by center
INSERT INTO collection_center_members (id, center_id, full_name, phone, role, is_active)
VALUES
  ('ccm_1', 'cc_1', 'Rafael Díaz', '0414-5550001', 'Recolector', true),
  ('ccm_2', 'cc_1', 'María González', '0414-5550002', 'Recolector', true),
  ('ccm_3', 'cc_2', 'Luis Hernández', '0412-5550003', 'Recolector', true),
  ('ccm_4', 'cc_3', 'Andrés Romero', '0424-5550004', 'Recolector', true)
ON CONFLICT (id) DO NOTHING;

-- App configuration (single row)
INSERT INTO app_configuration (id, collection_center_id, updated_at)
VALUES (1, 'cc_1', now())
ON CONFLICT (id) DO UPDATE SET collection_center_id = EXCLUDED.collection_center_id, updated_at = now();

-- Tickets (from RAW_SEED_DATA)
INSERT INTO tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at)
VALUES
  ('t_1', 'AV-BOL-2026-0001', '2/01/2026', 'gen_1', 'Restaurant El Gran Cacique', 'Aceite Vegetal Usado (AVU) - No Peligroso', 50, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_2', 'AV-BOL-2026-0002', '3/01/2026', 'gen_2', 'Club Caronoco', 'Aceite Vegetal Usado (AVU) - No Peligroso', 150, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_3', 'AV-BOL-2026-0003', '8/01/2026', 'gen_1', 'Restaurant El Gran Cacique', 'Aceite Vegetal Usado (AVU) - No Peligroso', 54, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_4', 'AV-BOL-2026-0004', '8/01/2026', 'gen_2', 'Club Caronoco', 'Aceite Vegetal Usado (AVU) - No Peligroso', 50, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_5', 'AV-BOL-2026-0005', '9/01/2026', 'gen_3', 'Aladyn', 'Aceite Vegetal Usado (AVU) - No Peligroso', 330, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_6', 'AV-BOL-2026-0006', '9/01/2026', 'gen_4', 'Palace Cantó', 'Aceite Vegetal Usado (AVU) - No Peligroso', 150, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_7', 'AV-BOL-2026-0007', '9/01/2026', 'gen_5', 'Pollos Rys', 'Aceite Vegetal Usado (AVU) - No Peligroso', 100, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_8', 'AV-BOL-2026-0008', '9/01/2026', 'gen_6', 'Chido Pizzas', 'Aceite Vegetal Usado (AVU) - No Peligroso', 4, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_9', 'AV-BOL-2026-0009', '9/01/2026', 'gen_7', 'Roof Burger', 'Aceite Vegetal Usado (AVU) - No Peligroso', 12, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_10', 'AV-BOL-2026-0010', '9/01/2026', 'gen_8', 'F. Jaimes', 'Aceite Vegetal Usado (AVU) - No Peligroso', 60, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_11', 'AV-BOL-2026-0011', '9/01/2026', 'gen_9', 'Dores Puerto Ordaz', 'Aceite Vegetal Usado (AVU) - No Peligroso', 70, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_12', 'AV-BOL-2026-0012', '10/01/2026', 'gen_10', 'Phoenix Asian Fast Food', 'Aceite Vegetal Usado (AVU) - No Peligroso', 80, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_13', 'AV-BOL-2026-0013', '10/01/2026', 'gen_11', 'Pollos Milus', 'Aceite Vegetal Usado (AVU) - No Peligroso', 25, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_14', 'AV-BOL-2026-0014', '10/01/2026', 'gen_12', 'Restaurant El Yaque', 'Aceite Vegetal Usado (AVU) - No Peligroso', 135, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_15', 'AV-BOL-2026-0015', '10/01/2026', 'gen_13', 'D''oro Pizza', 'Aceite Vegetal Usado (AVU) - No Peligroso', 30, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_16', 'AV-BOL-2026-0016', '10/01/2026', 'gen_14', 'Buffalo Bill PZO', 'Aceite Vegetal Usado (AVU) - No Peligroso', 30, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_17', 'AV-BOL-2026-0017', '12/01/2026', 'gen_1', 'Restaurant El Gran Cacique', 'Aceite Vegetal Usado (AVU) - No Peligroso', 70, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_18', 'AV-BOL-2026-0018', '12/01/2026', 'gen_15', 'Club Campestre Pesca y Paga', 'Aceite Vegetal Usado (AVU) - No Peligroso', 205, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_19', 'AV-BOL-2026-0019', '17/01/2026', 'gen_2', 'Club Caronoco', 'Aceite Vegetal Usado (AVU) - No Peligroso', 133, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_20', 'AV-BOL-2026-0020', '17/01/2026', 'gen_16', 'Panadería La Bodega', 'Aceite Vegetal Usado (AVU) - No Peligroso', 190, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_21', 'AV-BOL-2026-0021', '17/01/2026', 'gen_17', 'Pollo Portu''s', 'Aceite Vegetal Usado (AVU) - No Peligroso', 30, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_22', 'AV-BOL-2026-0022', '17/01/2026', 'gen_18', 'Porkis 286', 'Aceite Vegetal Usado (AVU) - No Peligroso', 36, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_23', 'AV-BOL-2026-0023', '17/01/2026', 'gen_7', 'Roof Burger', 'Aceite Vegetal Usado (AVU) - No Peligroso', 11, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_24', 'AV-BOL-2026-0024', '19/01/2026', 'gen_1', 'Restaurant El Gran Cacique', 'Aceite Vegetal Usado (AVU) - No Peligroso', 97, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_25', 'AV-BOL-2026-0025', '19/01/2026', 'gen_19', 'Pollos Daniels', 'Aceite Vegetal Usado (AVU) - No Peligroso', 75, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_26', 'AV-BOL-2026-0026', '19/01/2026', 'gen_9', 'Dores Puerto Ordaz', 'Aceite Vegetal Usado (AVU) - No Peligroso', 40, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_27', 'AV-BOL-2026-0027', '20/01/2026', 'gen_20', 'Chicken King 1990', 'Aceite Vegetal Usado (AVU) - No Peligroso', 212, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_28', 'AV-BOL-2026-0028', '20/01/2026', 'gen_2', 'Club Caronoco', 'Aceite Vegetal Usado (AVU) - No Peligroso', 60, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_29', 'AV-BOL-2026-0029', '20/01/2026', 'gen_8', 'F. Jaimes', 'Aceite Vegetal Usado (AVU) - No Peligroso', 12, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_30', 'AV-BOL-2026-0030', '20/01/2026', 'gen_21', 'Daniel Devera', 'Aceite Vegetal Usado (AVU) - No Peligroso', 116, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_31', 'AV-BOL-2026-0031', '26/01/2026', 'gen_1', 'Restaurant El Gran Cacique', 'Aceite Vegetal Usado (AVU) - No Peligroso', 88, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_32', 'AV-BOL-2026-0032', '26/01/2026', 'gen_2', 'Club Caronoco', 'Aceite Vegetal Usado (AVU) - No Peligroso', 136, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_33', 'AV-BOL-2026-0033', '26/01/2026', 'gen_22', 'Chimuelo Burger', 'Aceite Vegetal Usado (AVU) - No Peligroso', 36, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_34', 'AV-BOL-2026-0034', '26/01/2026', 'gen_23', 'King Kebab', 'Aceite Vegetal Usado (AVU) - No Peligroso', 23, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_35', 'AV-BOL-2026-0035', '26/01/2026', 'gen_8', 'F. Jaimes', 'Aceite Vegetal Usado (AVU) - No Peligroso', 36, 'Bruto', 'Rafael Díaz', 'A12BC3D', now()),
  ('t_36', 'AV-BOL-2026-0036', '26/01/2026', 'gen_9', 'Dores Puerto Ordaz', 'Aceite Vegetal Usado (AVU) - No Peligroso', 108, 'Bruto', 'Rafael Díaz', 'A12BC3D', now())
ON CONFLICT (id) DO NOTHING;

-- Vehicles by center
INSERT INTO vehicles (id, plate, brand, model, owner, is_default, collection_center_id)
VALUES
  ('veh_1', 'A12BC3D', 'Toyota', 'Hilux', 'Alternativa Verde', true, 'cc_1'),
  ('veh_2', 'B41ZX9Q', 'Ford', 'Ranger', 'Alternativa Verde', false, 'cc_1'),
  ('veh_3', 'C22RT7K', 'Chevrolet', 'N300', 'Alternativa Verde', true, 'cc_2'),
  ('veh_4', 'D88LM3P', 'JAC', 'X200', 'Alternativa Verde', true, 'cc_3')
ON CONFLICT (id) DO NOTHING;

-- Assign generators to centers (mock distribution)
UPDATE generators
SET collection_center_id = CASE
  WHEN (regexp_replace(id, '[^0-9]', '', 'g')::int % 3) = 0 THEN 'cc_3'
  WHEN (regexp_replace(id, '[^0-9]', '', 'g')::int % 2) = 0 THEN 'cc_2'
  ELSE 'cc_1'
END
WHERE collection_center_id IS NULL;

-- Align tickets with generator center and related collector/vehicle for realistic filtering
UPDATE tickets t
SET collection_center_id = g.collection_center_id,
    collector_member_id = CASE g.collection_center_id
      WHEN 'cc_1' THEN 'ccm_1'
      WHEN 'cc_2' THEN 'ccm_3'
      WHEN 'cc_3' THEN 'ccm_4'
      ELSE NULL
    END,
    collector_name = CASE g.collection_center_id
      WHEN 'cc_1' THEN 'Rafael Díaz'
      WHEN 'cc_2' THEN 'Luis Hernández'
      WHEN 'cc_3' THEN 'Andrés Romero'
      ELSE collector_name
    END,
    vehicle_plate = CASE g.collection_center_id
      WHEN 'cc_1' THEN 'A12BC3D'
      WHEN 'cc_2' THEN 'C22RT7K'
      WHEN 'cc_3' THEN 'D88LM3P'
      ELSE vehicle_plate
    END
FROM generators g
WHERE t.generator_id = g.id;

-- Extra tickets to validate per-center metrics and history pagination
INSERT INTO tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collection_center_id, collector_member_id, collector_name, vehicle_plate, created_at)
VALUES
  ('t_1001', 'AV-BOL-2026-1001', '1/02/2026', 'gen_3', 'Aladyn', 'Aceite Vegetal Usado (AVU) - No Peligroso', 90, 'Bruto', 'cc_2', 'ccm_3', 'Luis Hernández', 'C22RT7K', now()),
  ('t_1002', 'AV-BOL-2026-1002', '2/02/2026', 'gen_6', 'Chido Pizzas', 'Aceite Vegetal Usado (AVU) - No Peligroso', 45, 'Filtrado', 'cc_3', 'ccm_4', 'Andrés Romero', 'D88LM3P', now()),
  ('t_1003', 'AV-BOL-2026-1003', '3/02/2026', 'gen_1', 'Restaurant El Gran Cacique', 'Aceite Vegetal Usado (AVU) - No Peligroso', 120, 'Mezcla', 'cc_1', 'ccm_2', 'María González', 'B41ZX9Q', now())
ON CONFLICT (id) DO NOTHING;
