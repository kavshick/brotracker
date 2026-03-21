const { put, get } = require('@vercel/blob');

const BLOB_KEY = 'blob.json';
const DEFAULT_PRIVATE_BLOB_URL = 'https://uthm6wuitdkn5hsp.private.blob.vercel-storage.com/blob.json';
const BLOB_ACCESS = process.env.BLOB_ACCESS || 'private';
const PRIVATE_BLOB_URL = process.env.BLOB_PRIVATE_URL || DEFAULT_PRIVATE_BLOB_URL;

const DEFAULT_SCHEDULE = [
  { id: 1, day: 1, dayName: 'Monday', startH: 12, startM: 0, endH: 7, endM: 0, overnight: true, active: true },
  { id: 2, day: 2, dayName: 'Tuesday', startH: 17, startM: 0, endH: 23, endM: 0, overnight: false, active: true },
  { id: 3, day: 3, dayName: 'Wednesday', startH: 17, startM: 0, endH: 23, endM: 0, overnight: false, active: true },
  { id: 4, day: 4, dayName: 'Thursday', startH: 16, startM: 30, endH: 21, endM: 30, overnight: false, active: true },
  { id: 5, day: 5, dayName: 'Friday', startH: 13, startM: 0, endH: 19, endM: 0, overnight: false, active: true },
  { id: 6, day: 6, dayName: 'Saturday', startH: 7, startM: 0, endH: 15, endM: 0, overnight: false, active: true },
];

function getStorageMode() {
  return `blob-${BLOB_ACCESS}`;
}

async function readScheduleWithSdk() {
  try {
    const blob = await get(BLOB_KEY, { access: BLOB_ACCESS });
    
    // Handle the response - blob might be a stream or an object
    if (!blob) {
      return null;
    }

    // If it has a text method, it's a readable stream
    if (typeof blob.text === 'function') {
      const text = await blob.text();
      return JSON.parse(text);
    }

    // Otherwise, assume it's already text or object
    if (typeof blob === 'object' && blob !== null) {
      return blob;
    }

    // It might be just text
    if (typeof blob === 'string') {
      return JSON.parse(blob);
    }

    return null;
  } catch (error) {
    // Blob doesn't exist or other error
    if (error.code === 'BLOB_NOT_FOUND' || error.message?.includes('not found')) {
      return null;
    }
    throw error;
  }
}

async function writeSchedule(schedule) {
  await put(BLOB_KEY, JSON.stringify(schedule, null, 2), {
    access: BLOB_ACCESS,
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: 'application/json',
  });

  return schedule;
}

async function loadSchedule() {
  try {
    console.log('Attempting to load schedule from Blob SDK...');
    const schedule = await readScheduleWithSdk();
    if (schedule) {
      console.log('Successfully loaded schedule from Blob SDK');
      return schedule;
    }

    // Blob not found, initialize with default
    console.log('Blob not found, initializing with default schedule');
    try {
      await writeSchedule(DEFAULT_SCHEDULE);
    } catch (writeError) {
      console.error('Failed to initialize Blob with default schedule:', writeError.message);
    }
    return DEFAULT_SCHEDULE;
  } catch (error) {
    console.error('Failed to load from Blob:', error.message);
    // Fall back to default on any error
    return DEFAULT_SCHEDULE;
  }
}

async function saveSchedule(schedule) {
  try {
    return await writeSchedule(schedule);
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
