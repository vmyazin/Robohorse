import { test } from 'node:test';
import assert from 'node:assert/strict';
import FixedStepClock from '../frontend/js/managers/FixedStepClock.ts';
import LevelManager from '../frontend/js/levels/LevelManager.js';

test('30, 60, 120 and 144 Hz produce the same simulation ticks', () => {
    for (const hz of [30, 60, 120, 144]) {
        const clock = new FixedStepClock();
        let ticks = 0;
        for (let i = 0; i <= hz * 10; i++) clock.advance(i * 1000 / hz, () => ticks++);
        assert.equal(ticks, 600, `${hz} Hz`);
    }
});

test('tab suspension has bounded catch-up and reset discards old time', () => {
    const clock = new FixedStepClock();
    let ticks = 0;
    clock.advance(0, () => ticks++);
    clock.advance(60000, () => ticks++);
    assert.equal(ticks, 6);
    clock.reset();
    clock.advance(120000, () => ticks++);
    assert.equal(ticks, 6);
});

test('level scrolling never updates obstacle state a second time', () => {
    let updates = 0;
    const obstacle = { x: 100, width: 10, update() { updates++; } };
    const manager = new LevelManager({ gameSpeed: 1, obstacles: [obstacle] });
    manager.updateLevelElements = () => {};
    manager.update();
    assert.equal(updates, 0);
    assert.equal(obstacle.x, 98.8);
});
