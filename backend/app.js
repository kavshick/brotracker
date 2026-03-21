const express = require('express');
const cors = require('cors');
require('dotenv').config();
const {
  getStorageMode,
  loadSchedule,
  saveSchedule,
  resetSchedule,
} = require('./store');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/api/schedule', async (req, res, next) => {
  try {
    const schedule = await loadSchedule();
    res.json({
      schedule,
      storage: getStorageMode(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/schedule', async (req, res, next) => {
  try {
    const { schedule } = req.body || {};
    if (!Array.isArray(schedule)) {
      return res.status(400).json({ error: 'Invalid schedule' });
    }

    const saved = await saveSchedule(schedule);
    res.json({ success: true, schedule: saved, storage: getStorageMode() });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/schedule/reset', async (req, res, next) => {
  try {
    const schedule = await resetSchedule();
    res.json({ success: true, schedule, storage: getStorageMode() });
  } catch (error) {
    next(error);
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', storage: getStorageMode(), time: new Date().toISOString() });
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
