import { test, expect } from '@playwright/test';

test('measure rendering cost and repeated sound allocations', async ({ page }) => {
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    await page.keyboard.press('Space');
    const metrics = await page.evaluate(() => {
        const game = window.__game;
        const durations = [];
        for (let i = 0; i < 120; i++) {
            const start = performance.now();
            game.draw();
            durations.push(performance.now() - start);
        }
        durations.sort((a, b) => a - b);
        let clones = 0;
        const sound = game.soundManager.sounds.blasterGlowing;
        const original = sound.cloneNode.bind(sound);
        sound.cloneNode = () => { clones++; const node = original(); node.play = () => Promise.resolve(); return node; };
        for (let i = 0; i < 100; i++) game.soundManager.playSound('blasterGlowing');
        return { drawP95Ms: durations[114], soundClones: clones };
    });
    console.log('PERFORMANCE', JSON.stringify(metrics));
    expect(metrics.drawP95Ms).toBeLessThan(100);
    expect(metrics.soundClones).toBeLessThanOrEqual(8);
});
