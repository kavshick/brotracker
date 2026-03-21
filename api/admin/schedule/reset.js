const { getStorageMode, resetSchedule } = require('../../../backend/store');
const { methodNotAllowed, sendError, sendJson } = require('../../../backend/vercel-utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  try {
    const schedule = await resetSchedule();
    sendJson(res, 200, {
      success: true,
      schedule,
      storage: getStorageMode(),
    });
  } catch (error) {
    sendError(res, error);
  }
};
