import { test, expect } from '@playwright/test';

test('secret boss encounter supports combat, pause, victory and clean restart', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    await page.keyboard.press('Control+Shift+B');
    await expect.poll(() => page.evaluate(() => window.__game.boss?.tick)).toBeGreaterThan(10);
    await expect(page.locator('#start-screen')).toBeHidden();
    const position = await page.evaluate(() => window.__game.levelManager.levelPosition);
    await page.keyboard.down('Space');
    await expect.poll(() => page.evaluate(() => window.__game.boss.health)).toBeLessThan(600);
    await page.keyboard.up('Space');
    expect(await page.evaluate(() => window.__game.levelManager.levelPosition)).toBe(position);
    await page.keyboard.press('Escape');
    const tick = await page.evaluate(() => window.__game.boss.tick);
    await page.waitForTimeout(150);
    expect(await page.evaluate(() => window.__game.boss.tick)).toBe(tick);
    await page.screenshot({ path: 'test-results/boss-paused.png' });
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
        const g = window.__game;
        g.boss.health = 1;
        g.projectiles.push({ x: g.boss.x + 20, y: g.boss.y + 100, width: 15, height: 10,
            velX: 0, velY: 0, damage: 100, isPlayerProjectile: true, color: '#fff' });
    });
    await expect(page.locator('#mission-complete')).toBeVisible({ timeout: 10000 });
    expect(await page.evaluate(() => window.__game.score)).toBe(2500);
    await page.keyboard.press('Space');
    expect(await page.evaluate(() => window.__game.boss)).toBeNull();
    await page.keyboard.press('Control+Shift+B');
    await expect.poll(() => page.evaluate(() => window.__game.boss?.health)).toBe(600);
    await page.evaluate(() => {
        const g = window.__game;
        g.player.health = 1;
        g.boss.webs.push({ x: g.player.x, y: g.player.y, width: 25, height: 25, velX: 0, velY: 0, life: 30 });
    });
    await expect(page.locator('#game-over')).toBeVisible({ timeout: 12000 });
    await page.keyboard.press('Space');
    expect(await page.evaluate(() => window.__game.player.webSlowTicks)).toBe(0);
    expect(await page.evaluate(() => window.__game.boss)).toBeNull();
    expect(errors).toEqual([]);
});

test('final level ends in boss encounter instead of immediate victory', async ({ page }) => {
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    await page.keyboard.press('Space');
    await page.evaluate(() => {
        const g = window.__game;
        g.levelManager.loadLevel(2);
        g.levelManager.levelPosition = g.levelManager.levelLength - 1;
    });
    await expect.poll(() => page.evaluate(() => Boolean(window.__game.boss))).toBe(true);
    await expect(page.locator('#mission-complete')).toBeHidden();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'test-results/boss-gameplay.png' });
    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+Shift+B');
    await expect(page.locator('#pause-screen')).toBeHidden();
    expect(await page.evaluate(() => window.__game.boss.health)).toBe(600);
    expect(await page.evaluate(() => window.__game.player.specialAbilityTokens)).toBe(3);
});

test('approved titan sprite loads with transparency and damaged eyes remain readable', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    await page.keyboard.press('Control+Shift+B');
    await expect.poll(() => page.evaluate(() => performance.getEntriesByType('resource')
        .some(entry => entry.name.includes('kraken-titan')))).toBe(true);
    const alpha = await page.evaluate(async () => {
        const url = performance.getEntriesByType('resource').find(entry => entry.name.includes('kraken-titan')).name;
        const image = new Image(); image.src = url; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
        return { corner: ctx.getImageData(0, 0, 1, 1).data[3], eye: ctx.getImageData(369, 405, 1, 1).data[3] };
    });
    expect(alpha.corner).toBe(0);
    expect(alpha.eye).toBeGreaterThan(250);
    await page.evaluate(() => {
        const g = window.__game;
        g.boss.eyes[0].active = false;
        g.boss.eyes[4].active = false;
        g.boss.health = 180;
        g.boss.stunTimer = 90;
        g.boss.webs = [];
        g.boss.spiderlings = [];
        g.boss.waves = [];
        g.isPaused = true;
        g.boss.draw(g.ctx);
    });
    await page.screenshot({ path: 'test-results/boss-titan-damaged.png' });
    const state = await page.evaluate(() => {
        const g = window.__game;
        const before = JSON.stringify(g.boss);
        const canvas = document.createElement('canvas'); canvas.width = 1000; canvas.height = 600;
        const ctx = canvas.getContext('2d'); g.boss.draw(ctx);
        const first = canvas.toDataURL(); ctx.clearRect(0, 0, 1000, 600); g.boss.draw(ctx);
        return { stablePixels: first === canvas.toDataURL(), stableState: before === JSON.stringify(g.boss) };
    });
    expect(state).toEqual({ stablePixels: true, stableState: true });
    await page.evaluate(() => {
        const g = window.__game;
        g.player.webSlowTicks = 90;
        g.draw();
    });
    await page.screenshot({ path: 'test-results/horse-webbed.png' });

    const soles = await page.evaluate(() => {
        const boss = window.__game.boss;
        const canvas = document.createElement('canvas'); canvas.width = 1000; canvas.height = 600;
        const ctx = canvas.getContext('2d');
        boss.stunTimer = 0; boss.attackIndex = 1;
        return [0, 59, 69, 90].map(tick => {
            boss.tick = tick; boss.attackTick = tick;
            ctx.clearRect(0, 0, 1000, 600); boss.draw(ctx);
            const pixels = ctx.getImageData(0, 0, 1000, 600).data;
            return [35, 125, 370, 855, 1080, 1215].map(sourceX => {
                const x = Math.round(boss.x + (sourceX - 14) / 1225 * boss.width);
                for (let y = 570; y > 450; y--) {
                    if (pixels[(y * 1000 + x) * 4 + 3] > 200) return y;
                }
                return -1;
            });
        });
    });
    for (const frame of soles) {
        for (const y of frame) expect(Math.abs(y - 549)).toBeLessThanOrEqual(1);
    }

    expect(errors).toEqual([]);
});

test('projectile impacts visibly blink an eye and health loss progressively switches eyes off', async ({ page }) => {
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    await page.keyboard.press('Control+Shift+B');
    await expect.poll(() => page.evaluate(() => performance.getEntriesByType('resource')
        .some(entry => entry.name.includes('kraken-titan')))).toBe(true);
    const result = await page.evaluate(() => {
        const g = window.__game, boss = g.boss;
        g.isPaused = true;
        boss.random = () => 0.99;
        boss.tick = 0;
        const canvas = document.createElement('canvas'); canvas.width = 1000; canvas.height = 600;
        const ctx = canvas.getContext('2d');
        const eye = boss.eyes[5];
        const brightness = () => {
            ctx.clearRect(0, 0, 1000, 600); boss.draw(ctx);
            const pixel = ctx.getImageData(Math.round(boss.x + eye.x), Math.round(boss.y + eye.y), 1, 1).data;
            return pixel[0] + pixel[1] + pixel[2];
        };
        const before = brightness();
        const shots = [{ x: boss.x + 30, y: boss.y + 70, width: 8, height: 8, damage: 10, isPlayerProjectile: true }];
        boss.update(g.player, shots, () => {}, () => {});
        const after = brightness();
        const blinking = boss.eyes.filter(e => e.blinkTicks > 0).length;
        const counts = [500, 400, 300, 200, 100, 0].map(health => {
            boss.health = health; boss.updateEyeHealth();
            return boss.eyes.filter(e => e.active).length;
        });
        return { before, after, blinking, shots: shots.length, counts };
    });
    expect(result.shots).toBe(0);
    expect(result.blinking).toBe(1);
    expect(result.after).toBeLessThan(result.before / 2);
    expect(result.counts).toEqual([5, 4, 3, 2, 1, 0]);
});

test('boss jumps across arena, freezes in pause, lands facing inward and shakes the ground', async ({ page }) => {
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    await page.keyboard.press('Control+Shift+B');
    await page.evaluate(() => {
        const g = window.__game;
        g.boss.health = g.boss.nextJumpHealth;
    });
    await expect.poll(() => page.evaluate(() => {
        const g = window.__game;
        if (g.boss.jump?.tick >= 60) { g.isPaused = true; return true; }
        return false;
    }), { intervals: [50] }).toBe(true);
    const airborne = await page.evaluate(() => ({ x: window.__game.boss.x, y: window.__game.boss.y }));
    expect(airborne.y).toBeLessThan(120);
    await page.waitForTimeout(120);
    expect(await page.evaluate(() => ({ x: window.__game.boss.x, y: window.__game.boss.y }))).toEqual(airborne);
    await page.screenshot({ path: 'test-results/boss-jump.png' });
    await page.evaluate(() => { window.__game.isPaused = false; });
    await expect.poll(() => page.evaluate(() => {
        const g = window.__game;
        if (!g.boss.jump && g.boss.x === 30) { g.isPaused = true; return true; }
        return false;
    }), { intervals: [50] }).toBe(true);
    expect(await page.evaluate(() => window.__game.boss.facing)).toBe(1);
    expect(await page.evaluate(() => window.__game.boss.shakeTicks)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.__game.player.health)).toBe(60);
    await page.screenshot({ path: 'test-results/boss-left-landing.png' });
    await page.evaluate(() => {
        const g = window.__game; g.boss.health = g.boss.nextJumpHealth;
        g.boss.jumpCooldown = 0; g.isPaused = false;
    });
    await expect.poll(() => page.evaluate(() => window.__game.boss.facing)).toBe(-1);
    await page.keyboard.press('Control+Shift+B');
    expect(await page.evaluate(() => ({ jump: window.__game.boss.jump, shake: window.__game.boss.shakeTicks })))
        .toEqual({ jump: null, shake: 0 });
    expect(errors).toEqual([]);
});


test('a lethal boss stomp ends the run and restart clears the jump and shake', async ({ page }) => {
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    await page.keyboard.press('Control+Shift+B');
    await page.evaluate(() => {
        const g = window.__game;
        g.player.health = 35;
        g.boss.health = g.boss.nextJumpHealth;
    });
    await expect(page.locator('#game-over')).toBeVisible({ timeout: 12000 });
    expect(await page.evaluate(() => window.__game.player.health)).toBe(0);
    await page.keyboard.press('Space');
    expect(await page.evaluate(() => window.__game.boss)).toBeNull();
    expect(await page.evaluate(() => window.__game.player.health)).toBe(100);
});


test('battle endings freeze combat, blink, pause audio, and clean up on restart', async ({ page }) => {
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    await page.keyboard.press('Control+Shift+B');
    await page.evaluate(() => { window.__game.boss.health = 0; });
    await expect(page.locator('#battle-ending h1')).toHaveText('YOU DEFEATED THE BOSS');
    await expect(page.locator('#mission-complete')).toBeHidden();
    await expect.poll(() => page.evaluate(() => window.__game.battleEnding.tick)).toBeGreaterThan(80);
    const state = await page.evaluate(() => ({ boss: window.__game.boss.tick, frame: window.__game.frameCount, hp: window.__game.player.health }));
    await page.keyboard.down('Space');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    await page.keyboard.up('Space');
    expect(await page.evaluate(() => ({ boss: window.__game.boss.tick, frame: window.__game.frameCount, hp: window.__game.player.health }))).toEqual(state);
    await page.screenshot({ path: 'test-results/boss-victory-ending.png' });
    await expect.poll(() => page.evaluate(() => window.__game.soundManager.sounds.bossVictory.duration)).toBeGreaterThan(5.9);
    expect(await page.evaluate(() => window.__game.soundManager.sounds.bossVictory.duration)).toBeLessThan(6.2);
    await page.keyboard.press('Escape');
    const tick = await page.evaluate(() => window.__game.battleEnding.tick);
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => window.__game.battleEnding.tick)).toBe(tick);
    expect(await page.evaluate(() => window.__game.soundManager.endingMusic.paused)).toBe(true);
    await page.keyboard.press('Escape');
    await expect.poll(() => page.evaluate(() => window.__game.battleEnding.tick)).toBeGreaterThan(tick);
    await page.locator('#sound-toggle').click();
    await expect.poll(() => page.evaluate(() => window.__game.soundManager.endingMusic.paused)).toBe(true);
    await page.keyboard.press('Control+Shift+B');
    await expect(page.locator('#battle-ending')).toBeHidden();
    expect(await page.evaluate(() => window.__game.soundManager.endingMusic)).toBeNull();
    await page.evaluate(() => { const g = window.__game; g.player.health = 0; g.endGame(); });
    await expect(page.locator('#battle-ending h1')).toHaveText('YOU WERE DEFEATED');
    await expect.poll(() => page.evaluate(() => window.__game.battleEnding.tick)).toBeGreaterThan(90);
    await page.screenshot({ path: 'test-results/player-defeat-ending.png' });
    expect(await page.evaluate(() => window.__game.soundManager.endingMusic.paused)).toBe(true);
    await expect(page.locator('#game-over')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#battle-ending')).toBeHidden();
});
