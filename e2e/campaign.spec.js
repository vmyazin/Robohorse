import { test, expect } from '@playwright/test';

test('nine levels gate three bosses, preserve the run and finish only after the third', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    await page.keyboard.press('Space');
    expect(await page.evaluate(() => window.__game.levelManager.getAllLevels().length)).toBe(9);
    for (let level = 0; level < 9; level++) {
        const result = await page.evaluate(level => {
            const g = window.__game;
            const manager = g.levelManager;
            const entered = manager.currentLevel;
            g.player.health = 73;
            manager.levelPosition = manager.levelLength;
            manager.update();
            const bossName = g.boss?.name;
            if (g.boss) {
                g.boss.health = 0;
                g.update(1);
                // Exercise the real ending transition without a six-second wait per boss.
                g.battleEnding.tick = 359;
                g.update(1);
                g.draw();
            }
            return { entered, level: manager.currentLevel, bossName,
                score: g.score, health: g.player.health, speed: g.gameSpeed,
                nestCompleted: manager.nestCompleted, boss: Boolean(g.boss),
                playing: g.gameStarted };
        }, level);
        expect(result.entered).toBe(level);
        if (level % 3 === 2) {
            expect(result.bossName).toBe(['Krakenarachnid', 'Neon Widow', 'Signal Reaper'][Math.floor(level / 3)]);
            expect(result.score).toBe((Math.floor(level / 3) + 1) * 2500);
            expect(result.health).toBe(73);
            expect(result.boss).toBe(false);
            if (level < 8) {
                expect(result.speed).toBe(1);
                expect(result.nestCompleted).toBe(false);
            }
        }
        if (level < 8) {
            expect(result.level).toBe(level + 1);
            expect(result.playing).toBe(true);
            await expect(page.locator('#mission-complete')).toBeHidden();
        }
    }
    await expect(page.locator('#mission-complete')).toBeVisible();
    await page.locator('#mission-complete-instruction').click();
    expect(await page.evaluate(() => ({ level: window.__game.levelManager.currentLevel,
        score: window.__game.score, boss: window.__game.boss }))).toEqual({ level: 0, score: 0, boss: null });
    expect(errors).toEqual([]);
});

test('new chapter announcements fit the stage and navigation reaches the new levels', async ({ page }) => {
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    await page.keyboard.press('Space');
    for (const [level, name] of [[3, 'Neon Undertow'], [6, 'Last Transmission']]) {
        await page.evaluate(level => {
            const g = window.__game;
            g.levelManager.loadLevel(level - 1);
            g.goToNextLevel();
        }, level);
        await expect(page.locator('#level-announcement')).toContainText(name);
        await page.waitForTimeout(900);
        const announcement = await page.locator('#level-announcement').boundingBox();
        const stage = await page.locator('#gameCanvas').boundingBox();
        expect(announcement.x).toBeGreaterThanOrEqual(stage.x);
        expect(announcement.x + announcement.width).toBeLessThanOrEqual(stage.x + stage.width);
        await page.screenshot({ path: `test-results/campaign-chapter-${level / 3 + 1}.png` });
    }
});

test('Ctrl+N cycles chapters from menu, pause and boss endings without stale state', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    await page.keyboard.press('Control+n');
    await expect(page.locator('#level-announcement')).toContainText('CHAPTER 2 / 3');
    await expect(page.locator('#start-screen')).toBeHidden();
    await page.evaluate(() => { window.__game.score = 123; window.__game.player.health = 72; });
    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+n');
    await expect(page.locator('#pause-screen')).toBeHidden();
    await expect(page.locator('#level-announcement')).toContainText('CHAPTER 3 / 3');
    expect(await page.evaluate(() => ({ score: window.__game.score, health: window.__game.player.health })))
        .toEqual({ score: 123, health: 72 });
    await page.evaluate(() => { const g = window.__game; g.startBossBattle(); g.boss.health = 0; });
    await expect(page.locator('#battle-ending')).toBeVisible();
    await page.keyboard.press('Control+n');
    await expect(page.locator('#battle-ending')).toBeHidden();
    await expect(page.locator('#level-announcement')).toContainText('CHAPTER 1 / 3');
    expect(await page.evaluate(() => ({ boss: window.__game.boss, nest: window.__game.nest,
        slow: window.__game.player.webSlowTicks }))).toEqual({ boss: null, nest: null, slow: 0 });
    await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', {
        code: 'KeyN', key: 'n', ctrlKey: true, repeat: true, bubbles: true
    })));
    expect(await page.evaluate(() => window.__game.levelManager.currentLevel)).toBe(0);
    await page.evaluate(() => window.__game.endGame());
    await page.keyboard.press('Control+n');
    await expect(page.locator('#game-over')).toBeHidden();
    expect(await page.evaluate(() => ({ level: window.__game.levelManager.currentLevel,
        score: window.__game.score, health: window.__game.player.health })))
        .toEqual({ level: 3, score: 0, health: 100 });
    expect(errors).toEqual([]);
});

test('chapter layouts change formations while preserving rosters and attached platforms', async ({ page }) => {
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    await page.keyboard.press('Space');
    const result = await page.evaluate(() => {
        const g = window.__game;
        const levels = g.levelManager.getAllLevels();
        const roster = level => level.elements.map(e => `${e.type}:${e.subtype}`).sort();
        const reports = [];
        for (let index = 3; index < 9; index++) {
            g.levelManager.loadLevel(index);
            const level = levels[index];
            const base = levels[index % 3];
            const opening = g.enemies.map(e => ({ x: e.x, y: e.y }));
            const shelf = g.platforms.find(p => p.type === 'shelf');
            const height = shelf.y;
            const width = shelf.width;
            const oldX = shelf.x = -shelf.width - 201;
            g.player.health = 10000;
            g.update(1);
            g.draw();
            const pillar = g.platforms.find(p => p.type === 'pillar' && p.shelfId === shelf.shelfId);
            reports.push({ roster: JSON.stringify(roster(level)) === JSON.stringify(roster(base)),
                unique: new Set(level.elements.map(e => e.id)).size === level.elements.length,
                positions: level.elements.every(e => e.position > 0 && e.position < 5000),
                changed: JSON.stringify(level.elements) !== JSON.stringify(base.elements),
                openingVisible: opening.some(e => e.x > 500 && e.x < g.canvas.width),
                recycled: shelf.x > oldX + 1000 && shelf.y === height && shelf.width === width,
                attached: pillar.x === shelf.x + (shelf.width - pillar.width) / 2 && pillar.y === shelf.y + shelf.height });
        }
        return reports;
    });
    expect(result).toHaveLength(6);
    for (const report of result) expect(Object.values(report).every(Boolean)).toBe(true);
});
