import { Pool } from 'pg';

const args = process.argv.slice(2);
const countArgIndex = args.indexOf('--count');
const count = countArgIndex >= 0 ? parseInt(args[countArgIndex + 1] || '10000', 10) : 10000;
const batchSize = 1000;

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || undefined,
  database: process.env.PGDATABASE || 'tickets'
});

const materialTypes = ['Aceite Vegetal Usado'];
const materialStates = ['BRUTO', 'FILTRADO', 'MEZCLA'];
const collectors = ['Rafael Diaz', 'Maria Lopez', 'Carlos Perez', 'Ana Ruiz'];
const vehiclePlates = ['A12BC3D', 'B41ZX9Q', 'C22RT7K', 'D88LM3P'];
const collectionCenters = ['cc_1', 'cc_2', 'cc_3'];

const pad = (value, size) => String(value).padStart(size, '0');

const randomInt = (max) => Math.floor(Math.random() * max);

const randomDate = () => {
  const now = new Date();
  const daysAgo = randomInt(180);
  const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const day = pad(d.getDate(), 2);
  const month = pad(d.getMonth() + 1, 2);
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const ensureGenerators = async () => {
  await pool.query(
    `INSERT INTO collection_centers (id, name, state, city, address, is_active)
     VALUES
      ('cc_1', 'Centro de Acopio Puerto Ordaz', 'Bolívar', 'Puerto Ordaz', 'Zona Industrial Unare II', true),
      ('cc_2', 'Centro de Acopio Caracas', 'Distrito Capital', 'Caracas', 'Av. Intercomunal Petare', true),
      ('cc_3', 'Centro de Acopio Valencia', 'Carabobo', 'Valencia', 'Av. Bolívar Norte', true)
     ON CONFLICT (id) DO NOTHING`
  );

  await pool.query(
    `INSERT INTO app_configuration (id, collection_center_id, updated_at)
     VALUES (1, 'cc_1', now())
     ON CONFLICT (id) DO UPDATE SET collection_center_id = EXCLUDED.collection_center_id, updated_at = now()`
  );

  await pool.query(
    `INSERT INTO collection_center_members (id, center_id, full_name, phone, role, is_active)
     VALUES
      ('ccm_1', 'cc_1', 'Rafael Diaz', '0414-5550001', 'Recolector', true),
      ('ccm_3', 'cc_2', 'Luis Hernandez', '0412-5550003', 'Recolector', true),
      ('ccm_4', 'cc_3', 'Andres Romero', '0424-5550004', 'Recolector', true)
     ON CONFLICT (id) DO NOTHING`
  );

  await pool.query(
    `INSERT INTO vehicles (id, plate, brand, model, owner, is_default, collection_center_id)
     VALUES
      ('veh_perf_1', 'A12BC3D', 'Toyota', 'Hilux', 'Alternativa Verde', true, 'cc_1'),
      ('veh_perf_2', 'C22RT7K', 'Chevrolet', 'N300', 'Alternativa Verde', true, 'cc_2'),
      ('veh_perf_3', 'D88LM3P', 'JAC', 'X200', 'Alternativa Verde', true, 'cc_3')
     ON CONFLICT (id) DO NOTHING`
  );

  const gensResult = await pool.query('SELECT id, name, collection_center_id FROM generators ORDER BY name');
  if (gensResult.rows.length > 0) return gensResult.rows;

  const created = [];
  for (let i = 0; i < 50; i += 1) {
    const id = `gen_perf_${i + 1}`;
    const name = `Generador Perf ${pad(i + 1, 3)}`;
    const centerId = collectionCenters[i % collectionCenters.length];
    await pool.query(
      'INSERT INTO generators (id, name, rif, phone, address, sector, collection_center_id, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,now())',
      [id, name, `J-${pad(10000000 + i, 8)}-0`, '0414-0000000', 'Sector Test', 'Centro', centerId]
    );
    created.push({ id, name, collection_center_id: centerId });
  }
  return created;
};

const insertBatch = async (startIndex, generators) => {
  const values = [];
  const placeholders = [];

  for (let i = 0; i < batchSize && startIndex + i < count; i += 1) {
    const gen = generators[randomInt(generators.length)];
    const id = `t_perf_${Date.now()}_${startIndex + i}`;
    const ticketNumber = `AV-BOL-2026-PERF-${pad(startIndex + i + 1, 6)}`;
    const date = randomDate();
    const materialType = materialTypes[0];
    const quantity = (Math.random() * 800 + 20).toFixed(1);
    const materialState = materialStates[randomInt(materialStates.length)];
    const centerId = gen.collection_center_id || 'cc_1';
    const collectorName = centerId === 'cc_2' ? 'Luis Hernandez' : centerId === 'cc_3' ? 'Andres Romero' : collectors[randomInt(collectors.length)];
    const vehiclePlate = centerId === 'cc_2' ? 'C22RT7K' : centerId === 'cc_3' ? 'D88LM3P' : vehiclePlates[randomInt(vehiclePlates.length)];
    const collectorMemberId = centerId === 'cc_2' ? 'ccm_3' : centerId === 'cc_3' ? 'ccm_4' : 'ccm_1';

    const rowValues = [
      id,
      ticketNumber,
      date,
      gen.id,
      gen.name,
      materialType,
      quantity,
      materialState,
      centerId,
      collectorMemberId,
      collectorName,
      vehiclePlate
    ];

    const offset = values.length;
    const rowPlaceholders = rowValues.map((_, idx) => `$${offset + idx + 1}`);
    placeholders.push(`(${rowPlaceholders.join(',')}, now())`);
    values.push(...rowValues);
  }

  const sql = `INSERT INTO tickets (
    id,
    ticket_number,
    date,
    generator_id,
    generator_name,
    material_type,
    quantity,
    material_state,
    collection_center_id,
    collector_member_id,
    collector_name,
    vehicle_plate,
    created_at
  ) VALUES ${placeholders.join(',')}`;

  await pool.query(sql, values);
};

const main = async () => {
  const generators = await ensureGenerators();
  for (let offset = 0; offset < count; offset += batchSize) {
    await insertBatch(offset, generators);
    const progress = Math.min(offset + batchSize, count);
    process.stdout.write(`Insertados ${progress} / ${count}\n`);
  }
  await pool.end();
};

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
