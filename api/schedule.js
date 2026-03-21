const { getStorageMode, loadSchedule } = require('../backend/store');
const { methodNotAllowed, sendError, sendJson } = require('../backend/vercel-utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  try {
    const schedule = await loadSchedule();
    
    // Ensure schedule is always an array
    const validSchedule = Array.isArray(schedule) ? schedule : [];
    
    sendJson(res, 200, {
      schedule: validSchedule,
      storage: getStorageMode(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    sendError(res, error);
  }
};
