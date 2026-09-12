import { test, expect } from '@playwright/test';

test('all fleet models render clean, damaged and exploding without mutating gameplay on draw', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    const results = await page.evaluate(() => {
        const game = window.__game;
        game.levelManager.loadLevel(2);
        const Obstacle = game.obstacles.find(o => o.type === 'cybertruck').constructor;
        const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 220;
        const ctx = canvas.getContext('2d');
        const original = Math.random;
        const seen = new Set();
        let stable = true;
        try {
            for (let i = 0; i < 10; i++) {
                Math.random = () => (Math.min(i, 8) + 0.5) / 9;
                const car = new Obstacle(20, 50, i === 9 ? 'cybertruck' : 'car', canvas);
                seen.add(car.type === 'cybertruck' ? 6 : car.carModel);
                for (let hit = 0; hit <= car.explosionTriggerThreshold; hit++) {
                    const before = JSON.stringify(car);
                    car.draw(ctx, 100); car.draw(ctx, 100);
                    stable &&= before === JSON.stringify(car);
                    if (hit < car.explosionTriggerThreshold) car.takeDamage(1);
                }
            }
        } finally { Math.random = original; }
        return { models: [...seen].sort(), stable, alpha: ctx.globalAlpha };
    });
    expect(results.models).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(results.stable).toBe(true);
    expect(results.alpha).toBe(1);
    expect(errors).toEqual([]);
});

test('horse lands on fleet contours and follows hood and roof heights', async ({ page }) => {
    await page.route('**/api/scores', route => route.fulfill({ json: [] }));
    await page.goto('/robohorse/');
    const results = await page.evaluate(() => {
        const game = window.__game;
        game.levelManager.loadLevel(2);
        const Obstacle = game.obstacles.find(o => o.type === 'cybertruck').constructor;
        const p = game.player;
        const results = [];
        for (let model = 0; model < 7; model++) {
            const car = new Obstacle(300, 0, model === 6 ? 'cybertruck' : 'car', game.canvas);
            car.carModel = model;
            car.width = model >= 5 ? 200 : 180;
            car.height = model >= 5 ? 100 : model === 2 ? 60 : 80;
            car.y = 550 - car.height;
            const roof = car.getSurfaceY(300 + car.width * .4, 300 + car.width * .6);
            const hood = car.getSurfaceY(300 + car.width * .8, 300 + car.width * .95);
            let lands = true;
            for (const width of [120, 180]) {
                p.width = width; p.height = width * 2 / 3;
                for (const fraction of [.05, .5, .95]) {
                    p.x = car.x + car.width * fraction - p.width / 2;
                    const surface = car.getSurfaceY(p.x + p.width * .2, p.x + p.width * .8);
                    const previous = { x: p.x, y: surface - p.height - 40, width: p.width, height: p.height };
                    p.y = surface - p.height + 30; p.velY = 70;
                    p.standingOnObstacle = null;
                    game.combat.collide(car, previous, null);
                    lands &&= Math.abs(p.y + p.height - surface) < .001 && p.standingOnObstacle === car;
                    const before = { x: p.x, y: p.y, width: p.width, height: p.height };
                    p.x += 5; p.y += .5; p.velY = .5;
                    game.combat.collide(car, before, car);
                    const next = car.getSurfaceY(p.x + p.width * .2, p.x + p.width * .8);
                    lands &&= Math.abs(p.y + p.height - next) < .001;
                }
            }
            p.x = car.x - 70; p.y = 470; p.width = 120; p.height = 80; p.velY = .5;
            game.combat.collide(car, { x: p.x - 5, y: p.y, width: 120, height: 80 }, null);
            const blocksSide = p.x === car.x - p.width;
            results.push({ model, lands, blocksSide, hoodBelowRoof: hood > roof });
        }
        return results;
    });
    for (const result of results) {
        expect(result, `model ${result.model}`).toMatchObject({ lands: true, blocksSide: true, hoodBelowRoof: true });
    }
});
