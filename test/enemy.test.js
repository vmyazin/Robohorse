import { test } from 'node:test';
import assert from 'node:assert/strict';
import Enemy from '../frontend/js/entities/Enemy.js';

test('enemy defaults keep health and steering finite across simulation ticks', () => {
    const enemy = new Enemy(100, 100, { width: 30, height: 30, speed: 1, health: 50, points: 10, color: '#fff' }, { width: 1000, height: 600 });
    const player = { x: 150, y: 150, width: 30, height: 30 };
    assert.equal(enemy.maxHealth, 50);
    for (let frame = 0; frame < 600; frame++) {
        enemy.update(player, frame, () => {}, 1);
        for (const value of [enemy.x, enemy.y, enemy.velX, enemy.velY, enemy.directionChangeTimer]) assert.ok(Number.isFinite(value));
    }
    enemy.takeDamage(10);
    assert.equal(enemy.health, 40);
});
