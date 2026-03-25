const { Pool } = require('pg');

const STORE_KEY = 'weekly_schedule';
const STORE_TABLE = 'app_schedule_store';

const DEFAULT_SCHEDULE = [
  { id: 1, day: 1, dayName: 'Monday', startH: 12, startM: 0, endH: 7, endM: 0, overnight: true, active: true },
  { id: 2, day: 2, dayName: 'Tuesday', startH: 17, startM: 0, endH: 23, endM: 0, overnight: false, active: true },
  { id: 3, day: 3, dayName: 'Wednesday', startH: 17, startM: 0, endH: 23, endM: 0, overnight: false, active: true },
  { id: 4, day: 4, dayName: 'Thursday', startH: 16, startM: 30, endH: 21, endM: 30, overnight: false, active: true },
  { id: 5, day: 5, dayName: 'Friday', startH: 13, startM: 0, endH: 19, endM: 0, overnight: false, active: true },
  { id: 6, day: 6, dayName: 'Saturday', startH: 7, startM: 0, endH: 15, endM: 0, overnight: false, active: true },
];

let pool;
let initPromise;

function getEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function getDatabaseConfig() {
  const connectionString = getEnv(
    'POSTGRES_URL',
    'DATABASE_URL',
    'SUPABASE_DB_URL',
    'kruthick_POSTGRES_URL',
    'kruthick_POSTGRES_PRISMA_URL',
    'kruthick_POSTGRES_URL_NON_POOLING'
  );

  if (connectionString) {
    let normalizedConnectionString = connectionString;

    try {
      const parsed = new URL(connectionString);
      parsed.searchParams.delete('sslmode');
      normalizedConnectionString = parsed.toString();
    } catch (error) {
      console.warn('Unable to normalize POSTGRES_URL, using provided value as-is:', error.message);
    }

    return {
      connectionString: normalizedConnectionString,
      ssl: { rejectUnauthorized: false },
    };
  }

  const host = getEnv('POSTGRES_HOST', 'kruthick_POSTGRES_HOST');
  const port = Number(getEnv('POSTGRES_PORT', 'kruthick_POSTGRES_PORT')) || 5432;
  const database = getEnv('POSTGRES_DATABASE', 'kruthick_POSTGRES_DATABASE');
  const user = getEnv('POSTGRES_USER', 'kruthick_POSTGRES_USER');
  const password = getEnv('POSTGRES_PASSWORD', 'kruthick_POSTGRES_PASSWORD');

  if (!host || !database || !user || !password) {
    throw new Error(
      'Missing Supabase Postgres configuration. Set POSTGRES_URL/DATABASE_URL or provide host, database, user, and password env vars.'
    );
  }

  return {
    host,
    port,
    database,
    user,
    password,
    ssl: { rejectUnauthorized: false },
  };
}

function getPool() {
  if (!pool) {
    pool = new Pool(getDatabaseConfig());
  }

  return pool;
}

async function ensureStoreTable() {
  if (!initPromise) {
    initPromise = getPool().query(`
      CREATE TABLE IF NOT EXISTS ${STORE_TABLE} (
        key TEXT PRIMARY KEY,
        schedule JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  await initPromise;
}

function getStorageMode() {
  return 'supabase-postgres';
}

function normalizeSchedule(value) {
  return Array.isArray(value) ? value : null;
}

async function readSchedule() {
  await ensureStoreTable();
  const result = await getPool().query(
    `SELECT schedule FROM ${STORE_TABLE} WHERE key = $1 LIMIT 1`,
    [STORE_KEY]
  );

  if (!result.rows.length) {
    return null;
  }

  return normalizeSchedule(result.rows[0].schedule);
}

async function writeSchedule(schedule) {
  await ensureStoreTable();
  await getPool().query(
    `
      INSERT INTO ${STORE_TABLE} (key, schedule, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (key)
      DO UPDATE SET schedule = EXCLUDED.schedule, updated_at = NOW()
    `,
    [STORE_KEY, JSON.stringify(schedule)]
  );

  return schedule;
}

async function loadSchedule() {
  try {
    console.log('Attempting to load schedule from Supabase Postgres...');
    const schedule = await readSchedule();
    if (schedule) {
      console.log('Successfully loaded schedule from Supabase Postgres');
      return schedule;
    }

    console.log('Schedule row not found, initializing with default schedule');
    try {
      await writeSchedule(DEFAULT_SCHEDULE);
    } catch (writeError) {
      console.error('Failed to initialize Supabase schedule with default data:', writeError.message);
    }
    return DEFAULT_SCHEDULE;
  } catch (error) {
    console.error('Failed to load from Supabase Postgres:', error.message);
    return DEFAULT_SCHEDULE;
  }
}

async function saveSchedule(schedule) {
  try {
    return await writeSchedule(schedule);
  } catch (error) {
    console.error('Failed to save to Supabase Postgres:', error);
    throw error;
  }
}

async function resetSchedule() {
  return saveSchedule(DEFAULT_SCHEDULE);
}

module.exports = {
  DEFAULT_SCHEDULE,
  getStorageMode,
  loadSchedule,
  saveSchedule,
  resetSchedule,
};
