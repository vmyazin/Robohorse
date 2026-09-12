import { test, expect } from '@playwright/test';

test('built game starts, advances, ends and restarts without runtime errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    await expect(page.locator('#start-screen')).toBeVisible();
    await page.keyboard.press('Space');
    await expect(page.locator('#start-screen')).toBeHidden();
    await expect.poll(() => page.evaluate(() => window.__game.frameCount)).toBeGreaterThan(10);
    await page.screenshot({ path: 'test-results/gameplay.png' });
    await page.evaluate(() => window.__game.endGame());
    await expect(page.locator('#game-over')).toBeVisible();
    await page.evaluate(() => { window.__game.resetGame(); window.__game.startGame(); });
    await expect(page.locator('#game-over')).toBeHidden();
    await expect.poll(() => page.evaluate(() => window.__game.frameCount)).toBeGreaterThan(10);
    expect(errors).toEqual([]);
});

test('failed score loading displays a recoverable error', async ({ page }) => {
    await page.route('**/api/scores', route => route.fulfill({ status: 503, json: { error: 'Unavailable' } }));
    await page.goto('/robohorse/');
    await page.evaluate(() => window.__game.showScoreboard());
    await expect(page.locator('.scoreboard-body')).toContainText('Failed to load scores');
});

test('pause stops simulation and mission completion never cycles to the lobby', async ({ page }) => {
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    await page.keyboard.press('Space');
    await page.locator('#help-toggle').click();
    const pausedFrame = await page.evaluate(() => window.__game.frameCount);
    await page.waitForTimeout(150);
    expect(await page.evaluate(() => window.__game.frameCount)).toBe(pausedFrame);
    await page.locator('#help-toggle').click();
    await expect.poll(() => page.evaluate(() => window.__game.frameCount)).toBeGreaterThan(pausedFrame);
    await page.evaluate(() => {
        const game = window.__game;
        game.showMissionComplete();

    });
    await expect(page.locator('#mission-complete')).toBeVisible();
    await page.waitForTimeout(150);
    await expect(page.locator('#scoreboard-overlay')).toBeHidden();
    await expect(page.locator('#start-screen')).toBeHidden();
});

for (const fails of [false, true]) {
    test(`score submission sends one request and ${fails ? 'shows failure' : 'allows keyboard restart'}`, async ({ page }) => {
        const submissions = [];
        await page.route('**/api/scores', route => {
            if (route.request().method() === 'POST') {
                submissions.push(route.request().postDataJSON());
                return route.fulfill({ status: fails ? 503 : 201, json: {} });
            }
            return route.fulfill({ json: [] });
        });
        await page.goto('/robohorse/');
        await page.keyboard.press('Space');
        await expect.poll(() => page.evaluate(() => window.__game.frameCount)).toBeGreaterThan(10);
        await page.evaluate(() => { window.__game.score = 42; window.__game.endGame(); });
        await page.keyboard.press('a');
        await expect.poll(() => page.evaluate(() => window.__game.gameOverPlayerName.join(''))).toBe('A_____');
        await page.locator('#game-over-enter-key').click();
        await expect.poll(() => submissions.length).toBe(1);
        expect(submissions[0]).toEqual({ name: 'A', score: 42 });
        await expect(page.locator('#restart-instruction')).toBeVisible();
        if (fails) await expect(page.locator('#restart-instruction-status')).toContainText('Error saving score');
        await page.keyboard.press('Space');
        await expect(page.locator('#game-over')).toBeHidden();
        await expect.poll(() => page.evaluate(() => window.__game.frameCount)).toBeGreaterThan(10);
        expect(submissions).toHaveLength(1);
    });
}


test('stable menu supports controls, leaderboard back, and native keyboard play', async ({ page }) => {
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    await page.waitForTimeout(5500);
    await expect(page.locator('#start-screen')).toBeVisible();
    await expect(page.locator('#scoreboard-overlay')).toBeHidden();
    await page.locator('#start-screen [data-controls]').click();
    await expect(page.locator('#controls-screen')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#controls-screen')).toBeHidden();
    await page.locator('#menu-leaderboard').click();
    await expect(page.locator('#close-scoreboard')).toBeVisible();
    await page.locator('#close-scoreboard').click();
    await page.locator('#start-instruction').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#start-screen')).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(page.locator('#pause-screen')).toBeVisible();
    await page.locator('#pause-screen [data-controls]').click();
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => window.__game.isPaused)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('#pause-screen')).toBeHidden();
    await page.keyboard.press('Escape');
    await page.locator('#pause-restart').click();
    await expect(page.locator('#pause-screen')).toBeHidden();
    await expect.poll(() => page.evaluate(() => window.__game.frameCount)).toBeGreaterThan(2);
});

for (const complete of [false, true]) {
    test(`retry is visible before score submission on ${complete ? 'completion' : 'game over'}`, async ({ page }) => {
        await page.route('**/api/scores', route => route.fulfill({ json: [] }));
        await page.goto('/robohorse/');
        await page.locator('#start-instruction').click();
        await page.evaluate(complete => {
            window.__game.score = 42;
            if (complete) window.__game.showMissionComplete();
            else window.__game.endGame();
        }, complete);
        const retry = page.locator(complete ? '#mission-complete-instruction' : '#restart-instruction');
        await expect(retry).toBeVisible();
        await expect(retry).toContainText('Play again');
        await retry.click();
        await expect(page.locator('#game-over')).toBeHidden();
        await expect(page.locator('#mission-complete')).toBeHidden();
        await expect.poll(() => page.evaluate(() => window.__game.frameCount)).toBeGreaterThan(2);
    });
}

test('retry remains available during a pending save and late failures cannot change the new run', async ({ page }) => {
    let releaseSave;
    const pendingSave = new Promise(resolve => { releaseSave = resolve; });
    let submitted = false;
    await page.route('**/api/scores', async route => {
        if (route.request().method() === 'POST') {
            submitted = true;
            await pendingSave;
            return route.fulfill({ status: 503, json: {} });
        }
        return route.fulfill({ json: [] });
    });
    await page.goto('/robohorse/');
    await page.locator('#start-instruction').click();
    await page.evaluate(() => { window.__game.score = 42; window.__game.endGame(); });
    await page.keyboard.press('a');
    await page.locator('#game-over-enter-key').click();
    await expect.poll(() => submitted).toBe(true);
    await expect(page.locator('#restart-instruction-status')).toHaveText('Saving score…');
    await page.locator('#restart-instruction').click();
    const response = page.waitForResponse(r => r.request().method() === 'POST');
    releaseSave();
    await response;
    await expect(page.locator('#game-over')).toBeHidden();
    await expect(page.locator('#restart-instruction-status')).toHaveText('');
    await expect.poll(() => page.evaluate(() => window.__game.frameCount)).toBeGreaterThan(10);
});

test('HUD keeps labels inside their cells and level announcement below it', async ({ page }) => {
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    await page.locator('#start-instruction').click();
    await page.evaluate(() => { window.__game.player.specialAbilityTokens = 2; });
    await expect(page.locator('#special-ready')).toHaveText('Ready');
    const fits = await page.locator('.hud-stat').evaluateAll(cells => cells.every(cell => cell.scrollWidth <= cell.clientWidth));
    expect(fits).toBe(true);
    await expect(page.locator('#level-announcement')).toHaveClass('active');
    await page.waitForTimeout(900);
    const hud = await page.locator('#hud').boundingBox();
    const announcement = await page.locator('#level-announcement').boundingBox();
    expect(announcement.y).toBeGreaterThan(hud.y + hud.height);
});
