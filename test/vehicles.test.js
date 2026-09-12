import { test } from 'node:test';
import assert from 'node:assert/strict';
import Obstacle from '../frontend/js/entities/Obstacle.js';
import { chooseCarModel } from '../frontend/js/components/VehicleRenderer.js';

test('fleet selection favors everyday cars and includes all six standard models', () => {
    const chosen = Array.from({ length: 9 }, (_, i) => chooseCarModel(() => (i + 0.5) / 9));
    assert.deepEqual(chosen, [0, 0, 1, 1, 3, 3, 2, 4, 5]);
});

test('all standard variants retain five-hit destruction; Tesla retains ten hits and rewards', () => {
    const original = Math.random;
    try {
        for (let slot = 0; slot < 9; slot++) {
            Math.random = () => (slot + 0.5) / 9;
            const car = new Obstacle(0, 0, 'car', { width: 1000, height: 600 });
            assert.equal(car.height, car.carModel === 2 ? 60 : car.carModel === 5 ? 100 : 80);
            assert.equal(car.points, 100);
            for (let i = 0; i < 4; i++) assert.equal(car.takeDamage(999), false);
            assert.equal(car.takeDamage(1), true);
            assert.equal(car.isExploding, true);
        }
        const tesla = new Obstacle(0, 0, 'cybertruck', { width: 1000, height: 600 });
        assert.equal(tesla.width, 200); assert.equal(tesla.height, 100);
        assert.equal(tesla.points, 250);
        for (let i = 0; i < 9; i++) assert.equal(tesla.takeDamage(999), false);
        assert.equal(tesla.takeDamage(1), true);
    } finally { Math.random = original; }
});
