const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET;
const DATA_FILE = path.join(__dirname, 'schedule.json');

app.use(cors({ origin: '*' }));
app.use(express.json());

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

const DEFAULT_SCHEDULE = [
  { id: 1, day: 1, dayName: 'Monday', startH: 12, startM: 0, endH: 7, endM: 0, overnight: true, active: true },
  { id: 2, day: 2, dayName: 'Tuesday', startH: 17, startM: 0, endH: 23, endM: 0, overnight: false, active: true },
  { id: 3, day: 3, dayName: 'Wednesday', startH: 17, startM: 0, endH: 23, endM: 0, overnight: false, active: true },
  { id: 4, day: 4, dayName: 'Thursday', startH: 16, startM: 30, endH: 21, endM: 30, overnight: false, active: true },
  { id: 5, day: 5, dayName: 'Friday', startH: 13, startM: 0, endH: 19, endM: 0, overnight: false, active: true },
  { id: 6, day: 6, dayName: 'Saturday', startH: 7, startM: 0, endH: 15, endM: 0, overnight: false, active: true },
];

function loadSchedule() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch {}
  return DEFAULT_SCHEDULE;
}

function saveSchedule(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'JWT secret is not configured on the server' });
  }

  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/api/schedule', (req, res) => {
  res.json({ schedule: loadSchedule(), updatedAt: new Date().toISOString() });
});

app.post('/api/admin/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};

    if (!ADMIN_USERNAME || !ADMIN_PASSWORD_HASH) {
      return res.status(500).json({ error: 'Admin credentials are not configured on the server' });
    }

    if (!JWT_SECRET) {
      return res.status(500).json({ error: 'JWT secret is not configured on the server' });
    }

    const validUsername = username === ADMIN_USERNAME;
    const validPassword = typeof password === 'string' && await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

    if (validUsername && validPassword) {
      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '8h' });
      return res.json({ token, username });
    }

    res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/schedule', requireAuth, (req, res) => {
  const { schedule } = req.body || {};
  if (!Array.isArray(schedule)) {
    return res.status(400).json({ error: 'Invalid schedule' });
  }

  saveSchedule(schedule);
  res.json({ success: true, schedule });
});

app.patch('/api/admin/schedule/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const sched = loadSchedule();
  const idx = sched.findIndex((shift) => shift.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Shift not found' });
  }

  sched[idx] = { ...sched[idx], ...req.body, id };
  saveSchedule(sched);
  res.json({ success: true, shift: sched[idx] });
});

app.post('/api/admin/schedule/reset', requireAuth, (req, res) => {
  saveSchedule(DEFAULT_SCHEDULE);
  res.json({ success: true, schedule: DEFAULT_SCHEDULE });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const isJsonSyntaxError = err instanceof SyntaxError && err.status === 400 && 'body' in err;
  const status = isJsonSyntaxError ? 400 : err.status || 500;
  const message = isJsonSyntaxError ? 'Invalid JSON body' : err.message || 'Internal server error';

  console.error(err);
  res.status(status).json({ error: message });
});

module.exports = app;
