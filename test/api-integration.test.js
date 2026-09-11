import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { PGlite } from '@electric-sql/pglite';
import { createScoreRouter } from '../api/routes/scores.ts';
import { migrate } from '../api/db/migrate.js';

test('score API persists and ranks scores against PostgreSQL', async () => {
    const db = new PGlite();
    let server;
    try {
        await migrate({ connect: async () => ({ query: (sql, args) => args ? db.query(sql, args) : db.exec(sql).then(results => results[0]), release() {} }) });
        const app = express();
        app.use(express.json());
        app.use('/api/scores', createScoreRouter(db));
        server = app.listen(0);
        await new Promise(resolve => server.once('listening', resolve));
        const endpoint = `http://localhost:${server.address().port}/api/scores`;
        for (const [name, score] of [['LOW', 0], ['HIGH', 99], ['MID', 42]]) {
            const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, score }) });
            assert.equal(response.status, 201);
        }
        assert.deepEqual(await (await fetch(endpoint)).json(), [{ name: 'HIGH', score: 99 }, { name: 'MID', score: 42 }, { name: 'LOW', score: 0 }]);
        const bad = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'BAD', score: -1 }) });
        assert.equal(bad.status, 400);
        assert.equal((await db.query('SELECT * FROM scores')).rows.length, 3);
    } finally {
        if (server) await new Promise(resolve => server.close(resolve));
        await db.close();
    }
});
