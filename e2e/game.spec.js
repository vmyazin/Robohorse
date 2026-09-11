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
        game.startScreenToggleTimer = 4999;
    });
    await expect(page.locator('#mission-complete')).toBeVisible();
    await page.waitForTimeout(150);
    expect(await page.evaluate(() => window.__game.startScreenToggleTimer)).toBe(4999);
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
        if (fails) await expect(page.locator('#restart-instruction')).toContainText('Error saving score');
        await page.keyboard.press('Space');
        await expect(page.locator('#game-over')).toBeHidden();
        await expect.poll(() => page.evaluate(() => window.__game.frameCount)).toBeGreaterThan(10);
        expect(submissions).toHaveLength(1);
    });
}
