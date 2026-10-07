/**
 * Entrypoint for Vercel Express Serverless Service (api/ subdirectory convention)
 */
const app = require('../dist/server.js');
const handler = app.default || app;

module.exports = handler;
module.exports.default = handler;
