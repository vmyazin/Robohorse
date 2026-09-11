import { test } from 'node:test';
import assert from 'node:assert/strict';
import ScoreService from '../frontend/js/services/ScoreService.ts';

test('score service rejects malformed leaderboard responses', async () => {
    for (const body of [{}, [{ name: 'ABC', score: '12' }], [{ name: 'ABC', score: -1 }]]) {
        const service = new ScoreService('/robohorse/api/scores', async () => Response.json(body));
        await assert.rejects(service.list(), /Invalid leaderboard/);
    }
});

test('score service uses numeric scores and propagates rate-limit failures', async () => {
    let body;
    const service = new ScoreService('/robohorse/api/scores', async (url, options) => {
        assert.equal(url, '/robohorse/api/scores');
        body = JSON.parse(options.body);
        return new Response(null, { status: 429 });
    });
    await assert.rejects(service.save({ name: 'ANON', score: 0 }), /Please wait/);
    assert.deepEqual(body, { name: 'ANON', score: 0 });
});
