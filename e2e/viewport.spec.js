import { test, expect } from '@playwright/test';

test('stage fills available viewport while preserving ratio, padding and overlay alignment', async ({ page }) => {
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    for (const [width, height] of [[1920, 1080], [1280, 720], [844, 390], [390, 844]]) {
        await page.setViewportSize({ width, height });
        await expect.poll(async () => {
            const b = await page.locator('#gameCanvas').boundingBox();
            const padding = Math.max(12, Math.min(24, Math.min(width, height) * 0.02));
            const scale = Math.min((width - 2 * padding) / 1008, (height - 2 * padding) / 608);
            return Math.abs(b.width - 1000 * scale);
        }).toBeLessThan(1);
        const result = await page.evaluate(() => {
            const canvas = document.querySelector('#gameCanvas');
            const b = canvas.getBoundingClientRect();
            const hud = document.querySelector('#hud').getBoundingClientRect();
            const container = document.querySelector('#game-container').getBoundingClientRect();
            return { x: b.x, y: b.y, width: b.width, height: b.height,
                logical: [canvas.width, canvas.height],
                hudInset: (hud.x - b.x) / (b.width / 1000),
                overlayAligned: Math.abs(container.width - b.width) < 1 && Math.abs(container.height - b.height) < 1 };
        });
        expect(result.width / result.height).toBeCloseTo(5 / 3, 5);
        expect(result.x).toBeGreaterThan(12);
        expect(result.y).toBeGreaterThan(12);
        expect(result.logical).toEqual([1000, 600]);
        expect(result.hudInset).toBeCloseTo(16, 1);
        expect(result.overlayAligned).toBe(true);
        await page.screenshot({ path: `test-results/viewport-${width}x${height}.png` });
    }
    await page.locator('#start-instruction').click();
    await expect(page.locator('#start-screen')).toBeHidden();
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.locator('#help-toggle').click();
    await expect(page.locator('#pause-screen')).toBeVisible();
    expect(await page.evaluate(() => window.__game.isPaused)).toBe(true);
    await page.screenshot({ path: 'test-results/viewport-large-paused.png' });
});
