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
