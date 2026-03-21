const { put, get } = require('@vercel/blob');

const BLOB_KEY = 'blob.json';

const DEFAULT_SCHEDULE = [
  { id: 1, day: 1, dayName: 'Monday', startH: 12, startM: 0, endH: 7, endM: 0, overnight: true, active: true },
  { id: 2, day: 2, dayName: 'Tuesday', startH: 17, startM: 0, endH: 23, endM: 0, overnight: false, active: true },
  { id: 3, day: 3, dayName: 'Wednesday', startH: 17, startM: 0, endH: 23, endM: 0, overnight: false, active: true },
  { id: 4, day: 4, dayName: 'Thursday', startH: 16, startM: 30, endH: 21, endM: 30, overnight: false, active: true },
  { id: 5, day: 5, dayName: 'Friday', startH: 13, startM: 0, endH: 19, endM: 0, overnight: false, active: true },
  { id: 6, day: 6, dayName: 'Saturday', startH: 7, startM: 0, endH: 15, endM: 0, overnight: false, active: true },
];

let initialized = false;

function getStorageMode() {
  return 'blob';
}

async function loadSchedule() {
  try {
    const blob = await get(BLOB_KEY, { access: 'private' });
    
    if (!blob) {
      console.log('Blob not found, initializing with default schedule');
      await put(BLOB_KEY, JSON.stringify(DEFAULT_SCHEDULE, null, 2), { access: 'private' });
      return DEFAULT_SCHEDULE;
    }
    
    const text = await blob.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to load from Blob:', error);
    return DEFAULT_SCHEDULE;
  }
}

async function saveSchedule(schedule) {
  try {
    await put(BLOB_KEY, JSON.stringify(schedule, null, 2), { access: 'private' });
    return schedule;
  } catch (error) {
    console.error('Failed to save to Blob:', error);
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
