import { test, expect } from '@playwright/test';
test('nest eases travel, supports real shooting and pause, rewards and resets', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    await page.keyboard.press('Space');
    await page.evaluate(() => { window.__game.levelManager.levelPosition = 2200; });
    await expect.poll(() => page.evaluate(() => Boolean(window.__game.nest))).toBe(true);
    await expect.poll(() => page.evaluate(() => window.__game.scrollFactor), { timeout: 8000 }).toBe(0);
    const position = await page.evaluate(() => window.__game.levelManager.levelPosition);
    await page.keyboard.down('Space');
    await expect.poll(() => page.evaluate(() => window.__game.nest?.health), { timeout: 12000 }).toBeLessThan(240);
    await page.keyboard.up('Space');
    expect(await page.evaluate(() => window.__game.levelManager.levelPosition)).toBe(position);
    await page.keyboard.press('Escape');
    const tick = await page.evaluate(() => window.__game.nest.tick);
    await page.waitForTimeout(150);
    expect(await page.evaluate(() => window.__game.nest.tick)).toBe(tick);
    await page.keyboard.press('Escape');
    await page.screenshot({ path: 'test-results/nest-gameplay.png' });
    const score = await page.evaluate(() => {
        const g = window.__game; g.nest.phase = 'exposed'; g.nest.timer = 200;
        g.projectiles.push({ ...g.nest.core, velX: 0, velY: 0, damage: 999, isPlayerProjectile: true, color: '#fff' });
        return g.score;
    });
    await expect.poll(() => page.evaluate(() => window.__game.nest)).toBeNull();
    expect(await page.evaluate(() => window.__game.score)).toBe(score + 750);
    await expect.poll(() => page.evaluate(() => window.__game.levelManager.levelPosition)).toBeGreaterThan(position);
    await page.evaluate(() => { const g = window.__game; g.resetGame(); g.startGame(); g.levelManager.levelPosition = 2200; });
    await expect.poll(() => page.evaluate(() => Boolean(window.__game.nest))).toBe(true);
    await page.keyboard.press('Control+Shift+B');
    expect(await page.evaluate(() => window.__game.nest)).toBeNull();
    expect(errors).toEqual([]);
});

test('transition retains live enemies and scenery through braking and acceleration', async ({ page }) => {
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    await page.keyboard.press('Space');
    const result = await page.evaluate(() => {
        const g = window.__game;
        g.inputManager.keys = {};
        g.spawnEnemy();
        const enemy = g.enemies[0];
        enemy.x = 12; enemy.y = 80; enemy.baseY = 80; enemy.pattern = 'drone';
        const platforms = g.platforms, obstacles = g.obstacles;
        g.levelManager.levelPosition = 2200;
        const playerX = g.player.x;
        g.update(1);
        const entering = { factor: g.scrollFactor, x: g.player.x, retained: g.enemies.includes(enemy) };
        for (let i = 0; i < 239; i++) g.update(1);
        const stopped = { factor: g.scrollFactor, retained: g.enemies.includes(enemy), enemyX: enemy.x,
            platforms: g.platforms === platforms, obstacles: g.obstacles === obstacles };
        const position = g.levelManager.levelPosition, background = g.scrollFrame;
        for (let i = 0; i < 30; i++) g.update(1);
        const frozen = g.levelManager.levelPosition === position && g.scrollFrame === background;
        g.nest.health = 0;
        g.update(1);
        const after = { retained: g.enemies.includes(enemy), factor: g.scrollFactor };
        for (let i = 0; i < 240; i++) g.update(1);
        return { entering, stopped, frozen, after, playerX, resumed: g.scrollFactor === 1 && g.levelManager.levelPosition > position };
    });
    expect(result.entering.retained).toBe(true);
    expect(result.entering.x).toBe(result.playerX);
    expect(result.entering.factor).toBeGreaterThan(0.99);
    expect(result.stopped).toMatchObject({ factor: 0, retained: true, platforms: true, obstacles: true });
    expect(result.stopped.enemyX).toBeGreaterThanOrEqual(8);
    expect(result.frozen).toBe(true);
    expect(result.after).toEqual({ retained: true, factor: 0 });
    expect(result.resumed).toBe(true);
});

test('approved hatchery sprite has transparent edges and distinct shielded/open states', async ({ page }) => {
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    const pixels = await page.evaluate(async () => {
        const resource = performance.getEntriesByType('resource').find(entry => entry.name.includes('cybernetic-hatchery'));
        if (!resource) throw new Error('Hatchery sprite was not requested');
        const sprite = new Image(); sprite.src = resource.name; await sprite.decode();
        const canvas = document.createElement('canvas'); canvas.width = sprite.width; canvas.height = sprite.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(sprite, 0, 0);
        return { corner: ctx.getImageData(0, 0, 1, 1).data[3],
            closed: [...ctx.getImageData(488, 498, 1, 1).data],
            open: [...ctx.getImageData(1338, 498, 1, 1).data] };
    });
    expect(pixels.corner).toBe(0);
    expect(pixels.closed[0]).toBeGreaterThan(pixels.closed[1]);
    expect(pixels.open[1]).toBeGreaterThan(pixels.open[0]);
    await page.keyboard.press('Space');
    await page.evaluate(() => { const g = window.__game; g.levelManager.levelPosition = 2200; });
    await expect.poll(() => page.evaluate(() => Boolean(window.__game.nest))).toBe(true);
    await page.evaluate(() => {
        const g = window.__game; g.isPaused = true;
        g.nest.x = 760; g.nest.phase = 'shielded'; g.nest.timer = 30; g.draw();
    });
    await page.screenshot({ path: 'test-results/nest-hatchery-shielded.png' });
    await page.evaluate(() => {
        const g = window.__game; g.nest.phase = 'exposed'; g.nest.timer = 180; g.draw();
    });
    await page.screenshot({ path: 'test-results/nest-hatchery-open.png' });
});
