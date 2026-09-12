import { test, expect } from '@playwright/test';

test('stomps award a kill once; surviving enemies bounce the player; side contact still hurts', async ({ page }) => {
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    const results = await page.evaluate(() => {
        const game = window.__game;
        cancelAnimationFrame(game.animationFrameId);
        const scenarios = [];
        for (const [health, side] of [[30, false], [50, false], [50, true]]) {
            game.resetGame();
            game.gameStarted = true;
            game.obstacles = []; game.platforms = []; game.enemies = [];
            const p = game.player;
            p.x = 100; p.y = side ? 250 : 215; p.velY = side ? 0 : 8; p.isJumping = !side;
            const enemy = { x: 130, y: 300, width: 30, height: 30, health, points: 100,
                update() {}, takeDamage(amount) { this.health -= amount; return this.health <= 0; } };
            game.enemies.push(enemy);
            game.update(1);
            const first = { enemyHealth: enemy.health, playerHealth: p.health, vy: p.velY, score: game.score, enemyPresent: game.enemies.includes(enemy) };
            if (!side) game.update(1);
            scenarios.push({ ...first, laterScore: game.score, laterEnemyHealth: enemy.health });
        }
        return scenarios;
    });
    expect(results[0]).toMatchObject({ enemyHealth: 0, playerHealth: 100, vy: -8, score: 100, enemyPresent: false, laterScore: 100 });
    expect(results[1]).toMatchObject({ enemyHealth: 20, playerHealth: 100, vy: -8, score: 0, enemyPresent: true, laterEnemyHealth: 20 });
    expect(results[2]).toMatchObject({ enemyHealth: 50, playerHealth: 99, score: 0 });
});
