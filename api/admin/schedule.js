const { getStorageMode, saveSchedule } = require('../../backend/store');
const { methodNotAllowed, readJsonBody, sendError, sendJson } = require('../../backend/vercel-utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'PUT') {
    return methodNotAllowed(res, ['PUT']);
  }

  try {
    const { schedule } = await readJsonBody(req);

    if (!Array.isArray(schedule)) {
      return sendJson(res, 400, { error: 'Invalid schedule' });
    }

    const saved = await saveSchedule(schedule);
    sendJson(res, 200, {
      success: true,
      schedule: saved,
      storage: getStorageMode(),
    });
  } catch (error) {
    sendError(res, error);
  }
};
