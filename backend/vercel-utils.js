function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  sendJson(res, 405, { error: 'Method not allowed' });
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
  }

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    error.status = 400;
    error.publicMessage = 'Invalid JSON body';
    throw error;
  }
}

function sendError(res, error) {
  console.error(error);
  sendJson(res, error.status || 500, {
    error: error.publicMessage || error.message || 'Internal server error',
  });
}

module.exports = {
  methodNotAllowed,
  readJsonBody,
  sendError,
  sendJson,
};
