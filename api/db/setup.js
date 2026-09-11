import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { migrate } from './migrate.js';

dotenv.config({ path: [fileURLToPath(new URL('../.env', import.meta.url)), fileURLToPath(new URL('../../.env', import.meta.url))] });
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
try {
    await migrate(pool);
    console.log('Database migrations completed');
} catch (error) {
    console.error('Database migration failed:', error);
    process.exitCode = 1;
} finally { await pool.end(); }
