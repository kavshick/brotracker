const { put, get } = require('@vercel/blob');

const BLOB_KEY = 'blob.json';
const DEFAULT_PUBLIC_BLOB_URL = 'https://vczoykhczwbxmyjc.public.blob.vercel-storage.com/blob.json';
const BLOB_ACCESS = process.env.BLOB_ACCESS || 'public';
const PUBLIC_BLOB_URL = process.env.BLOB_PUBLIC_URL || DEFAULT_PUBLIC_BLOB_URL;

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

async function readPublicSchedule() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout

  try {
    const response = await fetch(PUBLIC_BLOB_URL, {
      cache: 'no-store',
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Public blob fetch failed with status ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readScheduleWithSdk() {
  try {
    const blob = await get(BLOB_KEY, { access: BLOB_ACCESS });
    return JSON.parse(await blob.text());
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
  let lastError = null;

  // Try SDK first if not explicitly using public mode
  if (BLOB_ACCESS !== 'public') {
    try {
      console.log('Attempting to load schedule from Blob SDK...');
      const schedule = await readScheduleWithSdk();
      if (schedule) {
        console.log('Successfully loaded schedule from Blob SDK');
        return schedule;
      }
    } catch (error) {
      console.warn('Failed to load from Blob SDK:', error.message);
      lastError = error;
    }
  }

  // Try public fetch if configured
  if (PUBLIC_BLOB_URL) {
    try {
      console.log('Attempting to load schedule from public Blob URL...');
      const schedule = await readPublicSchedule();
      if (schedule) {
        console.log('Successfully loaded schedule from public Blob URL');
        return schedule;
      }
    } catch (error) {
      console.warn('Failed to load from public Blob URL:', error.message);
      lastError = error;
    }
  }

  // Fall back to default
  console.log('Blob not found or unreachable, initializing with default schedule');
  try {
    await writeSchedule(DEFAULT_SCHEDULE);
  } catch (writeError) {
    console.error('Failed to initialize Blob with default schedule:', writeError.message);
  }

  return DEFAULT_SCHEDULE;
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
