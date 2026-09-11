import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createScoreRouter } from '../api/routes/scores.ts';

test('score API validates data and enforces submission limits', async () => {
    const queries = [];
    let time = 0;
    const app = express();
    app.use(express.json());
    app.use('/scores', createScoreRouter({ query: async (...args) => { queries.push(args); return { rows: [] }; } }, { limit: 2, now: () => time }));
    const server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    const send = body => fetch(`http://localhost:${server.address().port}/scores`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    try {
        for (const body of [{ name: 'ABC', score: '12junk' }, { name: [], score: 1 }, { name: ' ', score: 1 }, { name: 'ABC', score: -1 }, { name: 'ABC', score: 1.5 }, { name: 'ABC', score: 2147483648 }, { gameId: 'other', playerId: 'ABC', score: 1 }]) {
            time += 60001;
            assert.equal((await send(body)).status, 400);
        }
        assert.equal(queries.length, 0);
        time += 60001;
        assert.equal((await send({ name: 'ABC', score: '0' })).status, 201);
        assert.deepEqual(queries[0][1], ['robohorse-v1', 'ABC', 0]);
        assert.equal((await send({ name: 'ABC', score: 20 })).status, 201);
        assert.equal((await send({ name: 'ABC', score: 20 })).status, 429);
        time += 60001;
        assert.equal((await send({ name: 'ABC', score: 20 })).status, 201);
    } finally { await new Promise(resolve => server.close(resolve)); }
});
