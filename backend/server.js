/**
 * Entrypoint for Vercel Express Serverless Service
 */
let app = null;
let initError = null;

try {
  const exported = require('./dist/server.js');
  app = exported.default || exported;
} catch (err) {
  initError = {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: err.stack,
  };
  console.error('[SERVERLESS INIT CRASH]', err);
}

function handler(req, res) {
  if (initError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        status: 'error',
        source: 'backend-init-error',
        error: 'Backend service failed during initialization',
        details: initError,
      })
    );
    return;
  }

  try {
    return app(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        status: 'error',
        source: 'backend-runtime-error',
        error: 'Backend service failed during request execution',
        message: err.message,
        stack: err.stack,
      })
    );
  }
}

module.exports = handler;
module.exports.default = handler;
