import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || undefined,
  database: process.env.PGDATABASE || 'tickets'
});

const getActiveCenterId = async () => {
  const result = await pool.query('SELECT collection_center_id FROM app_configuration WHERE id = 1');
  return result.rows[0]?.collection_center_id || null;
};

const getEffectiveCenterId = async (req) => {
  const requested = (req.query.collectionCenterId || '').toString().trim();
  if (requested) return requested;
  return getActiveCenterId();
};

const buildStateCode = (stateName) => {
  const normalized = (stateName || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase();
  if (normalized.length >= 3) return normalized.slice(0, 3);
  return normalized.padEnd(3, 'X');
};

const extractYearFromTicketDate = (dateText) => {
  const value = (dateText || '').toString().trim();
  const slashMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) return parseInt(slashMatch[3], 10);
  const isoMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) return parseInt(isoMatch[1], 10);
  return new Date().getFullYear();
};

const resolveCenterIdForTicket = async (client, maybeCenterId) => {
  if (maybeCenterId) return maybeCenterId;
  const active = await client.query('SELECT collection_center_id FROM app_configuration WHERE id = 1');
  return active.rows[0]?.collection_center_id || null;
};

const generateNextTicketNumber = async (client, centerId, ticketDate) => {
  if (!centerId) throw new Error('collection center not configured');

  const centerResult = await client.query('SELECT state FROM collection_centers WHERE id = $1', [centerId]);
  const stateValue = centerResult.rows[0]?.state || '';
  const stateCode = buildStateCode(stateValue);
  const year = extractYearFromTicketDate(ticketDate);
  const seriesPrefix = `AV-${stateCode}-${year}`;

  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`ticket-seq:${seriesPrefix}`]);

  const lastResult = await client.query(
    `SELECT ticket_number
     FROM tickets
     WHERE ticket_number LIKE $1
     ORDER BY ticket_number DESC
     LIMIT 1`,
    [`${seriesPrefix}-%`]
  );

  const lastNumber = lastResult.rows[0]?.ticket_number || '';
  const match = lastNumber.match(/-(\d+)$/);
  const previous = match ? parseInt(match[1], 10) : 0;
  const next = previous + 1;
  return `${seriesPrefix}-${String(next).padStart(4, '0')}`;
};

const previewNextTicketNumber = async (client, centerId, ticketDate) => {
  if (!centerId) throw new Error('collection center not configured');

  const centerResult = await client.query('SELECT state FROM collection_centers WHERE id = $1', [centerId]);
  const stateValue = centerResult.rows[0]?.state || '';
  const stateCode = buildStateCode(stateValue);
  const year = extractYearFromTicketDate(ticketDate);
  const seriesPrefix = `AV-${stateCode}-${year}`;

  const lastResult = await client.query(
    `SELECT ticket_number
     FROM tickets
     WHERE ticket_number LIKE $1
     ORDER BY ticket_number DESC
     LIMIT 1`,
    [`${seriesPrefix}-%`]
  );

  const lastNumber = lastResult.rows[0]?.ticket_number || '';
  const match = lastNumber.match(/-(\d+)$/);
  const previous = match ? parseInt(match[1], 10) : 0;
  const next = previous + 1;
  return `${seriesPrefix}-${String(next).padStart(4, '0')}`;
};

app.get('/api/generators', async (req, res) => {
  try {
    const centerId = await getEffectiveCenterId(req);
    const result = centerId
      ? await pool.query('SELECT * FROM generators WHERE collection_center_id = $1 ORDER BY name', [centerId])
      : await pool.query('SELECT * FROM generators ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/tickets/count', async (req, res) => {
  try {
    const centerId = await getEffectiveCenterId(req);
    const result = centerId
      ? await pool.query('SELECT COUNT(*)::int AS total FROM tickets WHERE collection_center_id = $1', [centerId])
      : await pool.query('SELECT COUNT(*)::int AS total FROM tickets');
    res.json({ total: result.rows[0]?.total || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/generators/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM generators WHERE id = $1', [id]);
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/generators', async (req, res) => {
  const g = req.body;
  try {
    const sql = `INSERT INTO generators (id, name, rif, phone, address, sector, collection_mode, collection_center_id, created_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now()) RETURNING *`;
    const params = [g.id, g.name, g.rif, g.phone, g.address, g.sector, g.collectionMode || null, g.collectionCenterId || null];
    const result = await pool.query(sql, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB insert error' });
  }
});

app.delete('/api/generators/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM generators WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB delete error' });
  }
});

app.get('/api/vehicles', async (req, res) => {
  try {
    const centerId = await getEffectiveCenterId(req);
    const result = centerId
      ? await pool.query('SELECT * FROM vehicles WHERE collection_center_id = $1 ORDER BY is_default DESC, plate', [centerId])
      : await pool.query('SELECT * FROM vehicles ORDER BY is_default DESC, plate');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/vehicles', async (req, res) => {
  const v = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (v.isDefault) {
      if (v.collectionCenterId) {
        await client.query('UPDATE vehicles SET is_default = false WHERE collection_center_id = $1', [v.collectionCenterId]);
      } else {
        await client.query('UPDATE vehicles SET is_default = false');
      }
    }
    const sql = `INSERT INTO vehicles (id, plate, brand, model, owner, is_default, collection_center_id, created_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,now()) RETURNING *`;
    const params = [v.id, v.plate, v.brand, v.model, v.owner, !!v.isDefault, v.collectionCenterId || null];
    const result = await client.query(sql, params);
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'DB insert error' });
  } finally {
    client.release();
  }
});

app.put('/api/vehicles/:id', async (req, res) => {
  const { id } = req.params;
  const v = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (v.isDefault) {
      if (v.collectionCenterId) {
        await client.query('UPDATE vehicles SET is_default = false WHERE id <> $1 AND collection_center_id = $2', [id, v.collectionCenterId]);
      } else {
        await client.query('UPDATE vehicles SET is_default = false WHERE id <> $1', [id]);
      }
    }
    const sql = `UPDATE vehicles
                 SET plate=$1, brand=$2, model=$3, owner=$4, is_default=$5, collection_center_id=$6
                 WHERE id=$7 RETURNING *`;
    const params = [v.plate, v.brand, v.model, v.owner, !!v.isDefault, v.collectionCenterId || null, id];
    const result = await client.query(sql, params);
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'DB update error' });
  } finally {
    client.release();
  }
});

app.delete('/api/vehicles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM vehicles WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB delete error' });
  }
});

app.get('/api/dispatches', async (req, res) => {
  try {
    const centerId = await getEffectiveCenterId(req);
    const where = [];
    const params = [];
    let idx = 1;

    if (centerId) {
      where.push(`d.collection_center_id = $${idx}`);
      params.push(centerId);
      idx += 1;
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT d.*, v.plate AS vehicle_plate, v.brand AS vehicle_brand, v.model AS vehicle_model
       FROM dispatches d
       LEFT JOIN vehicles v ON d.vehicle_id = v.id
       ${whereClause}
       ORDER BY d.created_at DESC`,
      params
    );
    res.json(result.rows || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/dispatches', async (req, res) => {
  const d = req.body;
  try {
    const centerId = await getEffectiveCenterId(req);
    const sql = `INSERT INTO dispatches
      (id, date, description, presentation, dispatched_quantity, destination_name, destination_rif, destination_address,
       vehicle_id, driver_name, driver_id, minec_guide_number, collection_center_id, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now()) RETURNING *`;
    const params = [
      d.id,
      d.date,
      d.description || null,
      d.presentation || null,
      d.dispatchedQuantity ?? null,
      d.destinationName || null,
      d.destinationRif || null,
      d.destinationAddress || null,
      d.vehicleId || null,
      d.driverName || null,
      d.driverId || null,
      d.minecGuideNumber || null,
      centerId || null
    ];
    const result = await pool.query(sql, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB insert error' });
  }
});

app.put('/api/dispatches/:id', async (req, res) => {
  const { id } = req.params;
  const d = req.body;
  try {
    const centerId = await getEffectiveCenterId(req);
    const sql = `UPDATE dispatches
      SET date=$1,
          description=$2,
          presentation=$3,
          dispatched_quantity=$4,
          destination_name=$5,
          destination_rif=$6,
          destination_address=$7,
          vehicle_id=$8,
          driver_name=$9,
          driver_id=$10,
          minec_guide_number=$11,
          collection_center_id=$12
      WHERE id=$13 RETURNING *`;
    const params = [
      d.date,
      d.description || null,
      d.presentation || null,
      d.dispatchedQuantity ?? null,
      d.destinationName || null,
      d.destinationRif || null,
      d.destinationAddress || null,
      d.vehicleId || null,
      d.driverName || null,
      d.driverId || null,
      d.minecGuideNumber || null,
      centerId || null,
      id
    ];
    const result = await pool.query(sql, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB update error' });
  }
});

app.delete('/api/dispatches/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM dispatches WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB delete error' });
  }
});

app.get('/api/collection-centers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM collection_centers ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/collection-centers', async (req, res) => {
  const c = req.body;
  try {
    const sql = `INSERT INTO collection_centers (id, name, state, city, address, is_active, created_at)
                 VALUES ($1,$2,$3,$4,$5,$6,now()) RETURNING *`;
    const params = [c.id, c.name, c.state || '', c.city || '', c.address || '', c.isActive !== false];
    const result = await pool.query(sql, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB insert error' });
  }
});

app.put('/api/collection-centers/:id', async (req, res) => {
  const { id } = req.params;
  const c = req.body;
  try {
    const sql = `UPDATE collection_centers
                 SET name=$1, state=$2, city=$3, address=$4, is_active=$5
                 WHERE id=$6 RETURNING *`;
    const params = [c.name, c.state || '', c.city || '', c.address || '', c.isActive !== false, id];
    const result = await pool.query(sql, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB update error' });
  }
});

app.delete('/api/collection-centers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM collection_centers WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB delete error' });
  }
});

app.get('/api/collection-centers/:centerId/members', async (req, res) => {
  const { centerId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM collection_center_members WHERE center_id = $1 ORDER BY full_name', [centerId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/collection-center-members', async (req, res) => {
  const m = req.body;
  try {
    const sql = `INSERT INTO collection_center_members (id, center_id, full_name, cedula, phone, role, is_active, created_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,now()) RETURNING *`;
    const params = [m.id, m.centerId, m.fullName, m.cedula || '', m.phone || '', m.role || 'Recolector', m.isActive !== false];
    const result = await pool.query(sql, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB insert error' });
  }
});

app.put('/api/collection-center-members/:id', async (req, res) => {
  const { id } = req.params;
  const m = req.body;
  try {
    const sql = `UPDATE collection_center_members
                 SET center_id=$1, full_name=$2, cedula=$3, phone=$4, role=$5, is_active=$6
                 WHERE id=$7 RETURNING *`;
    const params = [m.centerId, m.fullName, m.cedula || '', m.phone || '', m.role || 'Recolector', m.isActive !== false, id];
    const result = await pool.query(sql, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB update error' });
  }
});

app.delete('/api/collection-center-members/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM collection_center_members WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB delete error' });
  }
});

app.get('/api/configuration', async (req, res) => {
  try {
    const result = await pool.query('SELECT collection_center_id FROM app_configuration WHERE id = 1');
    res.json({ collectionCenterId: result.rows[0]?.collection_center_id || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.put('/api/configuration', async (req, res) => {
  const { collectionCenterId } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql = `INSERT INTO app_configuration (id, collection_center_id, updated_at)
                 VALUES (1, $1, now())
                 ON CONFLICT (id)
                 DO UPDATE SET collection_center_id = EXCLUDED.collection_center_id, updated_at = now()
                 RETURNING collection_center_id`;
    const result = await client.query(sql, [collectionCenterId || null]);
    const savedCenterId = result.rows[0]?.collection_center_id || null;

    if (savedCenterId) {
      const countResult = await client.query('SELECT COUNT(*)::int AS total FROM collection_centers');
      const totalCenters = countResult.rows[0]?.total || 0;
      if (totalCenters === 1) {
        await client.query('UPDATE generators SET collection_center_id = $1 WHERE collection_center_id IS NULL', [savedCenterId]);
        await client.query('UPDATE vehicles SET collection_center_id = $1 WHERE collection_center_id IS NULL', [savedCenterId]);
        await client.query('UPDATE tickets SET collection_center_id = $1 WHERE collection_center_id IS NULL', [savedCenterId]);
      }
    }

    await client.query('COMMIT');
    res.json({ collectionCenterId: savedCenterId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'DB update error' });
  } finally {
    client.release();
  }
});

app.get('/api/tickets', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  const offset = parseInt(req.query.offset || '0', 10);
  const search = (req.query.search || '').toString().trim();
  const date = (req.query.date || '').toString().trim();
  const sortKey = (req.query.sortKey || '').toString().trim();
  const sortDir = (req.query.sortDir || '').toString().trim().toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const where = [];
  const params = [];
  let idx = 1;

  const centerId = await getEffectiveCenterId(req);
  if (centerId) {
    where.push(`t.collection_center_id = $${idx}`);
    params.push(centerId);
    idx += 1;
  }

  if (search) {
    where.push(`(t.generator_name ILIKE $${idx} OR t.ticket_number ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx += 1;
  }

  if (date) {
    where.push(`t.date ILIKE $${idx}`);
    params.push(`%${date}%`);
    idx += 1;
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sortMap = {
    ticketNumber: 't.ticket_number',
    date: `CASE
      WHEN t.date ~ '^\\d{1,2}/\\d{1,2}/\\d{4}$' THEN TO_DATE(t.date, 'DD/MM/YYYY')
      WHEN t.date ~ '^\\d{4}-\\d{1,2}-\\d{1,2}$' THEN TO_DATE(t.date, 'YYYY-MM-DD')
      ELSE NULL
    END`,
    center: 'COALESCE(cc.name, \'\')',
    generatorName: 't.generator_name',
    quantity: 't.quantity',
    collectorName: 't.collector_name'
  };
  const sortExpr = sortMap[sortKey] || 't.created_at';
  const orderBy = sortKey
    ? `ORDER BY ${sortExpr} ${sortDir}, t.created_at DESC`
    : 'ORDER BY t.created_at DESC';

  try {
    params.push(limit);
    params.push(offset);
    const dataResult = await pool.query(
      `SELECT t.*, COUNT(*) OVER()::int AS total
       FROM tickets t
       LEFT JOIN collection_centers cc ON t.collection_center_id = cc.id
       ${whereClause}
       ${orderBy}
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    const rows = dataResult.rows || [];
    const total = rows[0]?.total || 0;
    const items = rows.map(({ total, ...rest }) => rest);
    res.json({ items, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const centerId = await getEffectiveCenterId(req);
    const dateFrom = (req.query.dateFrom || '').toString().trim();
    const dateTo = (req.query.dateTo || '').toString().trim();
    const month = Number.parseInt((req.query.month || '').toString(), 10);
    const year = Number.parseInt((req.query.year || '').toString(), 10);
    const generatorId = (req.query.generatorId || '').toString().trim();
    const generatorIds = (req.query.generatorIds || '').toString().split(',').map(v => v.trim()).filter(Boolean);
    if (generatorId) generatorIds.push(generatorId);

    const where = [];
    const params = [];
    let idx = 1;

    if (centerId) {
      where.push(`t.collection_center_id = $${idx}`);
      params.push(centerId);
      idx += 1;
    }

    const dateExpr = `CASE
      WHEN t.date ~ '^\\d{1,2}/\\d{1,2}/\\d{4}$' THEN TO_DATE(t.date, 'DD/MM/YYYY')
      WHEN t.date ~ '^\\d{4}-\\d{1,2}-\\d{1,2}$' THEN TO_DATE(t.date, 'YYYY-MM-DD')
      ELSE NULL
    END`;

    if (dateFrom) {
      where.push(`${dateExpr} >= TO_DATE($${idx}, 'DD/MM/YYYY')`);
      params.push(dateFrom);
      idx += 1;
    }

    if (dateTo) {
      where.push(`${dateExpr} <= TO_DATE($${idx}, 'DD/MM/YYYY')`);
      params.push(dateTo);
      idx += 1;
    }

    if (Number.isInteger(month) && month >= 1 && month <= 12) {
      where.push(`EXTRACT(MONTH FROM ${dateExpr}) = $${idx}`);
      params.push(month);
      idx += 1;
    }

    if (Number.isInteger(year) && year > 0) {
      where.push(`EXTRACT(YEAR FROM ${dateExpr}) = $${idx}`);
      params.push(year);
      idx += 1;
    }

    if (generatorIds.length) {
      where.push(`t.generator_id = ANY($${idx})`);
      params.push(generatorIds);
      idx += 1;
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const dispatchWhere = [];
    const dispatchParams = [];
    let dIdx = 1;

    if (centerId) {
      dispatchWhere.push(`d.collection_center_id = $${dIdx}`);
      dispatchParams.push(centerId);
      dIdx += 1;
    }

    const dispatchDateExpr = `CASE
      WHEN d.date ~ '^\\d{1,2}/\\d{1,2}/\\d{4}$' THEN TO_DATE(d.date, 'DD/MM/YYYY')
      WHEN d.date ~ '^\\d{4}-\\d{1,2}-\\d{1,2}$' THEN TO_DATE(d.date, 'YYYY-MM-DD')
      ELSE NULL
    END`;

    if (dateFrom) {
      dispatchWhere.push(`${dispatchDateExpr} >= TO_DATE($${dIdx}, 'DD/MM/YYYY')`);
      dispatchParams.push(dateFrom);
      dIdx += 1;
    }

    if (dateTo) {
      dispatchWhere.push(`${dispatchDateExpr} <= TO_DATE($${dIdx}, 'DD/MM/YYYY')`);
      dispatchParams.push(dateTo);
      dIdx += 1;
    }

    if (Number.isInteger(month) && month >= 1 && month <= 12) {
      dispatchWhere.push(`EXTRACT(MONTH FROM ${dispatchDateExpr}) = $${dIdx}`);
      dispatchParams.push(month);
      dIdx += 1;
    }

    if (Number.isInteger(year) && year > 0) {
      dispatchWhere.push(`EXTRACT(YEAR FROM ${dispatchDateExpr}) = $${dIdx}`);
      dispatchParams.push(year);
      dIdx += 1;
    }

    const dispatchWhereClause = dispatchWhere.length ? `WHERE ${dispatchWhere.join(' AND ')}` : '';

    const scopedGeneratorCountSql = `SELECT COUNT(DISTINCT t.generator_id)::int AS total FROM tickets t ${whereClause}`;
    const scopedTicketsAggSql = `SELECT COUNT(*)::int AS total, COALESCE(SUM(t.quantity),0)::float AS liters FROM tickets t ${whereClause}`;
    const scopedLastFiveSql = `SELECT t.* FROM tickets t ${whereClause} ORDER BY t.created_at DESC LIMIT 5`;
            const scopedChartSql = `SELECT t.date, COALESCE(SUM(t.quantity),0)::float AS liters
          FROM tickets t
          ${whereClause}
          GROUP BY t.date
          ORDER BY ${dateExpr} ASC`;
            const scopedDispatchAggSql = `SELECT COALESCE(SUM(d.dispatched_quantity),0)::float AS liters
              FROM dispatches d ${dispatchWhereClause}`;
            const scopedDispatchChartSql = `SELECT d.date, COALESCE(SUM(d.dispatched_quantity),0)::float AS liters
              FROM dispatches d
              ${dispatchWhereClause}
              GROUP BY d.date
              ORDER BY ${dispatchDateExpr} ASC`;

    const [totalGens, ticketsAgg, lastFive, chartRows, dispatchAgg, dispatchChartRows] = await Promise.all([
      pool.query(scopedGeneratorCountSql, params),
      pool.query(scopedTicketsAggSql, params),
      pool.query(scopedLastFiveSql, params),
      pool.query(scopedChartSql, params),
      pool.query(scopedDispatchAggSql, dispatchParams),
      pool.query(scopedDispatchChartSql, dispatchParams)
    ]);

    const mergedChart = new Map();
    (chartRows.rows || []).forEach(row => {
      const current = mergedChart.get(row.date) || { date: row.date, litersIn: 0, litersOut: 0 };
      current.litersIn = Number(row.liters || 0);
      mergedChart.set(row.date, current);
    });
    (dispatchChartRows.rows || []).forEach(row => {
      const current = mergedChart.get(row.date) || { date: row.date, litersIn: 0, litersOut: 0 };
      current.litersOut = Number(row.liters || 0);
      mergedChart.set(row.date, current);
    });
    const chartData = Array.from(mergedChart.values());

    res.json({
      totalLiters: ticketsAgg.rows[0]?.liters || 0,
      totalDispatched: dispatchAgg.rows[0]?.liters || 0,
      ticketCount: ticketsAgg.rows[0]?.total || 0,
      totalGens: totalGens.rows[0]?.total || 0,
      lastFive: lastFive.rows,
      chartData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/tickets/report', async (req, res) => {
  try {
    const centerId = await getEffectiveCenterId(req);
    const dateFrom = (req.query.dateFrom || '').toString().trim();
    const dateTo = (req.query.dateTo || '').toString().trim();
    const month = Number.parseInt((req.query.month || '').toString(), 10);
    const year = Number.parseInt((req.query.year || '').toString(), 10);
    const generatorId = (req.query.generatorId || '').toString().trim();
    const generatorIds = (req.query.generatorIds || '').toString().split(',').map(v => v.trim()).filter(Boolean);
    if (generatorId) generatorIds.push(generatorId);

    const where = [];
    const params = [];
    let idx = 1;

    if (centerId) {
      where.push(`t.collection_center_id = $${idx}`);
      params.push(centerId);
      idx += 1;
    }

    const dateExpr = `CASE
      WHEN t.date ~ '^\\d{1,2}/\\d{1,2}/\\d{4}$' THEN TO_DATE(t.date, 'DD/MM/YYYY')
      WHEN t.date ~ '^\\d{4}-\\d{1,2}-\\d{1,2}$' THEN TO_DATE(t.date, 'YYYY-MM-DD')
      ELSE NULL
    END`;

    if (dateFrom) {
      where.push(`${dateExpr} >= TO_DATE($${idx}, 'DD/MM/YYYY')`);
      params.push(dateFrom);
      idx += 1;
    }

    if (dateTo) {
      where.push(`${dateExpr} <= TO_DATE($${idx}, 'DD/MM/YYYY')`);
      params.push(dateTo);
      idx += 1;
    }

    if (Number.isInteger(month) && month >= 1 && month <= 12) {
      where.push(`EXTRACT(MONTH FROM ${dateExpr}) = $${idx}`);
      params.push(month);
      idx += 1;
    }

    if (Number.isInteger(year) && year > 0) {
      where.push(`EXTRACT(YEAR FROM ${dateExpr}) = $${idx}`);
      params.push(year);
      idx += 1;
    }

    if (generatorIds.length) {
      where.push(`t.generator_id = ANY($${idx})`);
      params.push(generatorIds);
      idx += 1;
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT t.*
       FROM tickets t
       ${whereClause}
       ORDER BY ${dateExpr} ASC, t.created_at ASC`,
      params
    );
    res.json(result.rows || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/tickets/preview-number', async (req, res) => {
  const client = await pool.connect();
  try {
    const requestedCenterId = (req.query.collectionCenterId || '').toString().trim();
    const date = (req.query.date || '').toString().trim();
    const centerId = await resolveCenterIdForTicket(client, requestedCenterId || null);
    if (!centerId) {
      return res.status(400).json({ error: 'No hay centro de acopio activo configurado' });
    }
    const expectedTicketNumber = await previewNextTicketNumber(client, centerId, date);
    res.json({ expectedTicketNumber });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  } finally {
    client.release();
  }
});

app.get('/api/tickets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/tickets', async (req, res) => {
  const t = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const centerId = await resolveCenterIdForTicket(client, t.collectionCenterId || null);
    if (!centerId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No hay centro de acopio activo configurado' });
    }

    const ticketNumberToSave = await generateNextTicketNumber(client, centerId, t.date);

    const sql = `INSERT INTO tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collection_center_id, collector_member_id, collector_name, vehicle_plate, created_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now()) RETURNING *`;
    const params = [t.id, ticketNumberToSave, t.date, t.generatorId, t.generatorName, t.materialType, t.quantity, t.materialState, centerId, t.collectorMemberId || null, t.collectorName, t.vehiclePlate];
    const result = await client.query(sql, params);
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'DB insert error' });
  } finally {
    client.release();
  }
});

app.put('/api/tickets/:id', async (req, res) => {
  const { id } = req.params;
  const t = req.body;
  try {
    const sql = `UPDATE tickets SET ticket_number=$1, date=$2, generator_id=$3, generator_name=$4, material_type=$5, quantity=$6, material_state=$7, collection_center_id=$8, collector_member_id=$9, collector_name=$10, vehicle_plate=$11 WHERE id=$12 RETURNING *`;
    const params = [t.ticketNumber, t.date, t.generatorId, t.generatorName, t.materialType, t.quantity, t.materialState, t.collectionCenterId || null, t.collectorMemberId || null, t.collectorName, t.vehiclePlate, id];
    const result = await pool.query(sql, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB update error' });
  }
});

app.delete('/api/tickets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tickets WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB delete error' });
  }
});

app.put('/api/generators/:id', async (req, res) => {
  const { id } = req.params;
  const g = req.body;
  try {
    const sql = `UPDATE generators
                 SET name=$1, rif=$2, phone=$3, address=$4, sector=$5, collection_mode=$6, collection_center_id=$7
                 WHERE id=$8 RETURNING *`;
    const params = [g.name, g.rif, g.phone, g.address, g.sector, g.collectionMode || null, g.collectionCenterId || null, id];
    const result = await pool.query(sql, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB update error' });
  }
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
