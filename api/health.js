const { getStorageMode } = require('../backend/store');
const { methodNotAllowed, sendJson } = require('../backend/vercel-utils');

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  sendJson(res, 200, {
    status: 'ok',
    storage: getStorageMode(),
    time: new Date().toISOString(),
  });
};
