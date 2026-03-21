const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const DATA_FILE = path.join(__dirname, 'schedule.json');
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

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

function getStorageMode() {
  return DATABASE_URL ? 'database' : 'file';
}

function getPool() {
  if (!DATABASE_URL) {
    return null;
  }

  if (!pool) {
    const useSsl = !/localhost|127\.0\.0\.1/i.test(DATABASE_URL);
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    });
  }

  return pool;
}

async function ensureDatabase() {
  const db = getPool();
  if (!db) {
    return null;
  }

  if (!initPromise) {
    initPromise = db.query(`
      CREATE TABLE IF NOT EXISTS brotracker_schedule_state (
        id SMALLINT PRIMARY KEY,
        schedule JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  await initPromise;
  return db;
}

function loadFromFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch {}

  return DEFAULT_SCHEDULE;
}

function saveToFile(schedule) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(schedule, null, 2));
  return schedule;
}

async function loadSchedule() {
  const db = await ensureDatabase();

  if (!db) {
    return loadFromFile();
  }

  const { rows } = await db.query('SELECT schedule FROM brotracker_schedule_state WHERE id = 1');
  if (rows[0]?.schedule) {
    return rows[0].schedule;
  }

  await db.query(
    'INSERT INTO brotracker_schedule_state (id, schedule) VALUES (1, $1::jsonb)',
    [JSON.stringify(DEFAULT_SCHEDULE)]
  );

  return DEFAULT_SCHEDULE;
}

async function saveSchedule(schedule) {
  const db = await ensureDatabase();

  if (!db) {
    return saveToFile(schedule);
  }

  await db.query(
    `
      INSERT INTO brotracker_schedule_state (id, schedule, updated_at)
      VALUES (1, $1::jsonb, NOW())
      ON CONFLICT (id)
      DO UPDATE SET schedule = EXCLUDED.schedule, updated_at = NOW()
    `,
    [JSON.stringify(schedule)]
  );

  return schedule;
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
