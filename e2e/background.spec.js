import { test, expect } from '@playwright/test';

test('night scenery is deterministic, the train moves and restarting randomizes the route', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    const result = await page.evaluate(() => {
        const game = window.__game;
        const canvas = document.createElement('canvas');
        canvas.width = 1000; canvas.height = 600;
        const ctx = canvas.getContext('2d');
        const snapshot = frame => {
            game.background.draw(ctx, frame);
            return ctx.getImageData(0, 0, 1000, 600).data.slice();
        };
        const equal = (a, b) => a.every((value, i) => value === b[i]);
        game.background.startFrame = 0;
        const districts = [0, 16, 32, 48].map(seconds => snapshot(seconds * 60));
        const frozen = snapshot(33 * 60);
        const repeated = snapshot(33 * 60);
        const moving = snapshot(34 * 60);
        // Isolate the train band, avoiding the other district's parallax motion.
        let trainChanges = 0;
        for (let y = 224; y < 273; y++) for (let x = 0; x < 1000; x++) {
            const i = (y * 1000 + x) * 4;
            if (frozen[i] !== moving[i] || frozen[i + 1] !== moving[i + 1]) trainChanges++;
        }
        const expected = snapshot(2400);
        const resetBackground = game.background.reset.bind(game.background);
        game.background.reset = () => resetBackground(() => 0.625);
        game.frameCount = 3000;
        game.resetGame();
        const reset = snapshot(game.frameCount);
        game.background.reset = resetBackground;
        const transform = ctx.getTransform();
        return { deterministic: equal(frozen, repeated), trainChanges,
            distinct: districts.slice(1).every(image => !equal(image, districts[0])),
            reset: equal(expected, reset), startFrame: game.background.startFrame, frame: game.frameCount, alpha: ctx.globalAlpha,
            transform: [transform.a, transform.b, transform.c, transform.d, transform.e, transform.f] };
    });
    expect(result.deterministic).toBe(true);
    expect(result.trainChanges).toBeGreaterThan(100);
    expect(result.distinct).toBe(true);
    expect(result.reset).toBe(true);
    expect(result.frame).toBe(0);
    expect(result.startFrame).toBe(2400);
    expect(result.alpha).toBe(1);
    expect(result.transform).toEqual([1, 0, 0, 1, 0, 0]);
    expect(errors).toEqual([]);
});
