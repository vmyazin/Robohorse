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
        game.startScreenToggleTimer = 4999;
    });
    await expect(page.locator('#mission-complete')).toBeVisible();
    await page.waitForTimeout(150);
    expect(await page.evaluate(() => window.__game.startScreenToggleTimer)).toBe(4999);
    await expect(page.locator('#start-screen')).toBeHidden();
});
