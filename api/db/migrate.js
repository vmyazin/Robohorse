import { readdir, readFile } from 'node:fs/promises';

export async function migrate(pool) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock(4270001)');
        await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
        const directory = new URL('./migrations/', import.meta.url);
        for (const name of (await readdir(directory)).filter(name => name.endsWith('.sql')).sort()) {
            const result = await client.query('SELECT name FROM schema_migrations WHERE name = $1', [name]);
            if (result.rows.length) continue;
            await client.query(await readFile(new URL(name, directory), 'utf8'));
            await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
        }
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally { client.release(); }
}
