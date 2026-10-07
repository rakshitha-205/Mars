/**
 * Entrypoint for Vercel Express Serverless Service
 */
const exported = require('./dist/server.js');
const app = exported.default || exported;

module.exports = app;
module.exports.default = app;
