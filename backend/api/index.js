/**
 * Entrypoint for Vercel Express Serverless Service (api/ convention)
 */
let app = null;
let initError = null;

try {
  const exported = require('../../dist/server.js');
  app = exported.default || exported;
} catch (err) {
  try {
    const exported2 = require('../dist/server.js');
    app = exported2.default || exported2;
  } catch (err2) {
    initError = {
      name: err2.name,
      message: err2.message,
      code: err2.code,
      stack: err2.stack,
    };
    console.error('[SERVERLESS INIT CRASH]', err2);
  }
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
