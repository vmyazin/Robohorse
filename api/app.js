// api/app.js
// Shared Express application; launchers own the HTTP listener.

import express from 'express';
import { existsSync } from 'node:fs';
import { createScoreRouter } from './routes/scores.js';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { dirname } from 'path';

// Initialize environment variables
dotenv.config();

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;
const app = express();
const buildRoot = path.join(__dirname, '../deploy/robohorse');
const frontendRoot = process.env.FRONTEND_ROOT || (process.env.PASSENGER_WRAPPED ? path.join(__dirname, '..') : (existsSync(path.join(buildRoot, 'index.html')) ? buildRoot : path.join(__dirname, '../frontend')));

// Determine if we're in production and set the base path accordingly
const isProduction = process.env.NODE_ENV === 'production';
const basePath = isProduction ? '/robohorse' : '';

// Database connection — Neon requires SSL in all environments.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000
});

app.disable('x-powered-by');
app.use(express.json({ limit: '4kb' }));

// Serve static files from the frontend directory
// Restrict flat Passenger deployments to public assets, never API source or config.
for (const prefix of ['', '/robohorse']) {
    for (const directory of ['assets', 'js', 'css', 'images', 'audio']) {
        app.use(`${prefix}/${directory}`, express.static(path.join(frontendRoot, directory), { index: false }));
    }
    for (const page of ['index.html', 'playtest.html', 'scoreboard.html', 'scoreboard-test.html']) {
        app.get(`${prefix}/${page}`, (req, res) => res.sendFile(path.join(frontendRoot, page)));
    }
    app.get(`${prefix}/`, (req, res) => res.sendFile(path.join(frontendRoot, 'index.html')));
    app.get(`${prefix}/playtest`, (req, res) => res.sendFile(path.join(frontendRoot, 'playtest.html')));
    app.get(`${prefix}/favicon.png`, (req, res) => res.sendFile(path.join(frontendRoot, 'images/elon.png')));
}
app.get(['/api/health', '/robohorse/api/health'], (req, res) => res.json({ status: 'ok' }));

app.use(['/api/scores', '/robohorse/api/scores'], createScoreRouter(pool));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    const status = err.type === 'entity.too.large' ? 413 : err.type === 'entity.parse.failed' ? 400 : 500;
    res.status(status).json({ error: status === 500 ? 'Internal server error' : 'Invalid request body' });
});

export default app;
