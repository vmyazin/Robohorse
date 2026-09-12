import { test, expect } from '@playwright/test';

test('plated horse draws every weapon and power state without advancing simulation', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    const result = await page.evaluate(() => {
        const game = window.__game;
        const canvas = document.createElement('canvas');
        canvas.width = 400; canvas.height = 300;
        const ctx = canvas.getContext('2d');
        const p = new game.player.constructor({ width: 1000, height: 600 }, game.weapons);
        p.x = 10; p.y = 10;
        const failures = [];
        for (const direction of [-1, 1]) for (let weapon = 0; weapon < game.weapons.length; weapon++) {
            p.direction = direction;
            p.currentWeaponIndex = weapon; p.currentWeapon = game.weapons[weapon];
            p.specialAbilityActive = weapon % 2 === 0;
            p.appearance.recoil = 1;
            p.appearance.hurt = 0.5;
            p.isJumping = weapon % 2 === 1;
            const before = JSON.stringify(p);
            for (let frame = 0; frame < 5; frame++) p.draw(ctx);
            if (before !== JSON.stringify(p)) failures.push('Drawing mutated player');
        }
        p.isJumping = false;
        p.activateMushroomPower(() => {});
        for (let tick = 0; tick < 30; tick++) { p.updateGrowthAnimation(() => {}); p.draw(ctx); }
        p.deactivateMushroomPower(() => {});
        for (let tick = 0; tick < 25; tick++) { p.updateShrinkAnimation(() => {}); p.draw(ctx); }
        const transform = ctx.getTransform();
        return { failures, finiteBounds: [p.x, p.y, p.width, p.height].every(Number.isFinite),
            width: p.width, height: p.height, shrinking: p.isShrinking,
            transform: [transform.a, transform.b, transform.c, transform.d, transform.e, transform.f] };
    });
    expect(result.failures).toEqual([]);
    expect(result.finiteBounds).toBe(true);
    expect([result.width, result.height, result.shrinking]).toEqual([120, 80, false]);
    expect(result.transform).toEqual([1, 0, 0, 1, 0, 0]);
    expect(errors).toEqual([]);
});
