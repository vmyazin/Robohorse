import test from 'node:test';
import assert from 'node:assert/strict';
import { updateMushroom } from '../frontend/js/managers/PickupPhysics.js';

test('mushroom accelerates downward, lands flush, and scrolls offscreen with the floor', () => {
    const pickup = { x: 150, y: 100, width: 25, height: 25 };
    updateMushroom(pickup, 550, 1.2);
    const firstFall = pickup.y - 100;
    const previousY = pickup.y;
    updateMushroom(pickup, 550, 1.2);
    assert.ok(pickup.y - previousY > firstFall);
    for (let i = 0; i < 150; i++) updateMushroom(pickup, 550, 1.2);
    assert.equal(pickup.y + pickup.height, 550);
    assert.equal(pickup.velY, 0);
    assert.ok(pickup.x + pickup.width < 0);
    assert.ok(Math.abs(pickup.x - (150 - 152 * 1.2)) < 1e-9);
});

test('stopped scrolling still allows gravity and clamps an overshooting landing', () => {
    const pickup = { x: 100, y: 524, width: 25, height: 25, velY: 15 };
    updateMushroom(pickup, 550, 0, 0.5);
    assert.equal(pickup.x, 100);
    assert.equal(pickup.y, 525);
    assert.equal(pickup.velY, 0);
    updateMushroom(pickup, 550, 0);
    assert.equal(pickup.y, 525);
});
