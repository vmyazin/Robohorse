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

const canvas = { width: 1000, height: 600 };
const player = { x: 150, y: 450, width: 30, height: 30 };
function makeEnemy(pattern, x = 700) {
    return new Enemy(x, 180, { pattern, width: 30, height: 30, speed: 1, health: 50, points: 10, color: '#fff' }, canvas);
}

test('each attack warns for its full duration and fires along its locked cue', () => {
    for (const pattern of ['drone', 'ground', 'shield']) {
        const enemy = makeEnemy(pattern);
        for (let i = 0; i < 90; i++) assert.equal(enemy.update(player, i, () => {}), null);
        assert.equal(enemy.attackState, 'telegraph');
        const aim = [enemy.aimX, enemy.aimY];
        const moved = { ...player, y: 0 };
        for (let i = 0; i < enemy.cueDuration - 1; i++) assert.equal(enemy.update(moved, i, () => {}), null);
        const shot = enemy.update(moved, 0, () => {});
        assert.equal(shot.velX, aim[0] * 5);
        assert.equal(shot.velY, aim[1] * 5);
        assert.equal(enemy.attackState, 'recover');
    }
});

test('shields resist damage while closed and expose themselves before firing', () => {
    const enemy = makeEnemy('shield');
    enemy.takeDamage(10);
    assert.equal(enemy.health, 48);
    for (let i = 0; i < 90; i++) enemy.update(player, i, () => {});
    assert.equal(enemy.shieldActive, false);
    enemy.takeDamage(10);
    assert.equal(enemy.health, 38);
});

test('ground formation keeps spacing through entry, warnings and recovery', () => {
    const pair = [makeEnemy('ground', 1012), makeEnemy('ground', 1078)];
    for (let i = 0; i < 500; i++) {
        pair.forEach(enemy => enemy.update(player, i, () => {}));
        assert.ok(Math.abs(pair[1].x - pair[0].x - 66) < 0.0001);
        assert.equal(pair[0].y, 520);
    }
});

test('drone arc and attack clock are independent of simulation step size', () => {
    const a = makeEnemy('drone');
    const b = makeEnemy('drone');
    for (let i = 0; i < 80; i++) a.update(player, i, () => {}, 1);
    for (let i = 0; i < 160; i++) b.update(player, i, () => {}, 0.5);
    assert.ok(Math.abs(a.x - b.x) < 0.0001);
    assert.ok(Math.abs(a.y - b.y) < 0.0001);
    assert.equal(a.attackTimer, b.attackTimer);
    assert.notEqual(a.y, a.baseY);
});
