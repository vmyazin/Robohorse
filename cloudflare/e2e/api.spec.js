import { test, expect } from '@playwright/test';

test('Worker serves the game and D1 persists and ranks scores through both API paths', async ({ request }) => {
    const game = await request.get('/robohorse/');
    expect(game.ok()).toBe(true);
    expect(await game.text()).toContain('gameCanvas');
    expect((await request.get('/.env')).status()).toBe(404);
    expect((await request.get('/api/app.js')).status()).toBe(404);
    expect((await request.get('/api/health')).ok()).toBe(true);
    for (const [name, score] of [['LOW', 1], ['HIGH', 900], ['MID', '100']]) {
        const result = await request.post('/robohorse/api/scores', { data: { name, score } });
        expect(result.status()).toBe(201);
    }
    const scores = await request.get('/api/scores/robohorse-v1');
    expect(await scores.json()).toEqual([{ name: 'HIGH', score: 900 }, { name: 'MID', score: 100 }, { name: 'LOW', score: 1 }]);
    expect(scores.headers()['cache-control']).toBe('no-store');
    expect((await request.post('/api/scores', { data: { name: 'BAD', score: -1 } })).status()).toBe(400);
    expect((await request.post('/api/scores', { data: { name: 'BAD', score: 1, game_id: 'other' } })).status()).toBe(400);
    expect((await request.post('/api/scores', { data: '{', headers: { 'Content-Type': 'application/json' } })).status()).toBe(400);
    expect((await request.post('/api/scores', { data: 'x'.repeat(4097), headers: { 'Content-Type': 'application/json' } })).status()).toBe(413);
    // Exhaust this local rate-limit window, then confirm an API-level rejection.
    let rejected = false;
    for (let i = 0; i < 20; i++) {
        const result = await request.post('/api/scores', { data: { name: 'LIMIT', score: 0 } });
        if (result.status() === 429) {
            expect(result.headers()['retry-after']).toBe('60');
            rejected = true;
            break;
        }
    }
    expect(rejected).toBe(true);
});
