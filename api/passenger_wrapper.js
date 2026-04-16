// api/passenger_wrapper.js
// CommonJS entry for Phusion Passenger. Creates an HTTP server synchronously
// so Passenger has something to hook `listen` on, then lazily imports the
// ESM Express app and forwards requests to it.

const http = require('http');
const path = require('path');
const fs = require('fs');

const envPath = fs.existsSync(path.join(__dirname, '.env'))
  ? path.join(__dirname, '.env')
  : path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log('Loaded .env from', envPath);
} else {
  console.warn('No .env file found at', envPath);
}

console.log('NODE_ENV =', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'missing');

// Prevent app.js from starting its own dev listener when loaded by the wrapper.
process.env.PASSENGER_WRAPPED = '1';

let app = null;
const pending = [];

const server = http.createServer((req, res) => {
  if (app) return app(req, res);
  pending.push([req, res]);
});

import('./app.js')
  .then((mod) => {
    if (!mod.default) throw new Error('app.js has no default export');
    app = mod.default;
    while (pending.length) {
      const [req, res] = pending.shift();
      app(req, res);
    }
    console.log('app.js loaded');
  })
  .catch((err) => {
    console.error('Failed to load app.js:', err);
    process.exit(1);
  });

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const port = process.env.PORT || 4270;
server.listen(port, () => {
  console.log(`Passenger wrapper listening on ${port}`);
});

module.exports = server;
