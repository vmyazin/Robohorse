import { test } from 'node:test';
import assert from 'node:assert/strict';
import KrakenBoss from '../frontend/js/entities/KrakenBoss.js';
const canvas = { width: 1000, height: 600 };
const player = () => ({ x: 100, y: 470, width: 120, height: 80 });
const noop = () => {};

test('boss telegraphs each attack and emits moving hazards only after warning', () => {
    for (let mode = 0; mode < 3; mode++) {
        const boss = new KrakenBoss(canvas);
        boss.attackIndex = mode;
        const group = [boss.webs, boss.waves, boss.spiderlings][mode];
        for (let i = 0; i < 59; i++) boss.update(player(), [], noop, noop);
        assert.equal(group.length, 0);
        boss.update(player(), [], noop, noop);
        assert.ok(group.length > 0);
        const x = group[0].x;
        boss.update(player(), [], noop, noop);
        assert.ok(group[0].x < x);
    }
});

test('eyes take full damage while armor reduces damage; early hits do not extinguish eyes', () => {
    const boss = new KrakenBoss(canvas);
    boss.takeDamage(20, { x: boss.x, y: boss.y, width: 5, height: 5 });
    assert.equal(boss.health, 592);
    const eye = boss.eyes[0];
    boss.takeDamage(40, { x: boss.x + eye.x, y: boss.y + eye.y, width: 5, height: 5 });
    assert.equal(boss.health, 552);
    assert.equal(eye.active, true);
    assert.equal(boss.stunTimer, 0);
    boss.health = 190;
    assert.equal(boss.phase, 3);
});

test('webs slow and hurt, slams can be jumped, spiderlings can be shot', () => {
    const boss = new KrakenBoss(canvas), p = player();
    let damage = 0;
    boss.webs.push({ ...p, velX: 0, life: 10 });
    boss.update(p, [], amount => damage += amount, noop);
    assert.equal(damage, 8);
    assert.equal(p.webSlowTicks, 90);
    boss.hitCooldown = 0;
    boss.waves.push({ x: 100, y: 518, width: 42, height: 32, velX: 0, life: 10 });
    p.y = 380;
    boss.update(p, [], amount => damage += amount, noop);
    assert.equal(damage, 8);
    p.y = 470;
    boss.update(p, [], amount => damage += amount, noop);
    assert.equal(damage, 23);
    boss.spiderlings.push({ x: 400, y: 522, width: 30, height: 28, velX: 0, life: 10 });
    const shots = [{ x: 400, y: 522, width: 10, height: 10, isPlayerProjectile: true }];
    boss.update(p, shots, noop, noop);
    assert.equal(shots.length, 0);
    assert.equal(boss.spiderlings.length, 0);
});


test('each hit blinks one random active eye and the blink expires in simulation time', () => {
    let choice = 0;
    const boss = new KrakenBoss(canvas, () => choice);
    const shot = { x: boss.x, y: boss.y, width: 5, height: 5 };
    boss.takeDamage(1, shot);
    assert.equal(boss.eyes[0].blinkTicks, 12);
    choice = 0.99;
    boss.takeDamage(1, shot);
    assert.equal(boss.eyes[5].blinkTicks, 12);
    assert.equal(boss.eyes.filter(e => e.blinkTicks > 0).length, 1);
    for (let i = 0; i < 12; i++) boss.update(player(), [], noop, noop);
    assert.equal(boss.eyes.filter(e => e.blinkTicks > 0).length, 0);
});

test('six eyes extinguish evenly over health loss and never regenerate after stun', () => {
    const boss = new KrakenBoss(canvas, () => 0);
    const shot = { x: boss.x, y: boss.y, width: 5, height: 5 };
    for (let n = 0; n < 6; n++) {
        boss.health = 600 - n * 100;
        boss.stunTimer = 0;
        boss.takeDamage(247.5, shot); // Armor absorbs 60%: 99 actual damage.
        assert.equal(boss.eyes.filter(e => e.active).length, 6 - n);
        boss.takeDamage(2.5, shot); // Cross the next 100 HP boundary.
        assert.equal(boss.eyes.filter(e => e.active).length, 5 - n);
        if (boss.health > 0) {
            assert.equal(boss.eyes.filter(e => e.blinkTicks > 0 && e.active).length, 1);
            for (let i = 0; i < 91; i++) boss.update(player(), [], noop, noop);
            assert.equal(boss.eyes.filter(e => e.active).length, 5 - n);
        }
    }
    assert.equal(boss.health, 0);
});

test('a large hit turns off every crossed eye threshold at once', () => {
    const boss = new KrakenBoss(canvas, () => 0.5);
    boss.takeDamage(800, { x: boss.x, y: boss.y, width: 5, height: 5 });
    assert.equal(boss.health, 280);
    assert.equal(boss.eyes.filter(e => e.active).length, 3);
});

test('health milestones trigger alternating high jumps and one heavy landing each', () => {
    const boss = new KrakenBoss(canvas, () => 0.5), p = player();
    assert.equal(boss.nextJumpHealth, 450);
    boss.health = 451; boss.update(p, [], noop, noop);
    assert.equal(boss.jump, null);
    boss.health = 450; boss.update(p, [], noop, noop);
    assert.ok(boss.jump);
    const initialX = boss.x;
    for (let i = 0; i < 69; i++) boss.update(p, [], noop, noop);
    assert.ok(boss.y < boss.groundY - 200);
    assert.ok(boss.x < initialX && boss.x > 30);
    for (let i = 0; i < 40; i++) boss.update(p, [], noop, noop);
    assert.equal(boss.x, 30);
    assert.equal(boss.y, boss.groundY);
    assert.equal(boss.facing, 1);
    assert.equal(boss.shakeTicks, 36);
    assert.equal(boss.landed, true);
    assert.ok(p.x >= boss.x + boss.width);
    assert.equal(p.direction, -1);
    boss.update(p, [], noop, noop);
    assert.equal(boss.landed, false);
    assert.equal(boss.shakeTicks, 35);
    for (let i = 0; i < 60; i++) boss.update(p, [], noop, noop);
    boss.health = 300;
    for (let i = 0; i < 110; i++) boss.update(p, [], noop, noop);
    assert.equal(boss.x, initialX);
    assert.equal(boss.facing, -1);
    assert.equal(boss.nextJumpHealth, 150);
});

test('jump threshold sampling spans 20–30 percent and left-side attacks travel right', () => {
    for (const random of [0, 0.999999]) {
        const boss = new KrakenBoss(canvas, () => random);
        const loss = boss.maxHealth - boss.nextJumpHealth;
        assert.ok(loss >= 120 && loss <= 180);
    }
    for (const index of [1, 2]) {
        const boss = new KrakenBoss(canvas);
        boss.x = 30; boss.facing = 1; boss.attackIndex = index; boss.attackTick = 59;
        boss.update({ x: 800, y: 470, width: 120, height: 80 }, [], noop, noop);
        const hazard = index === 1 ? boss.waves[0] : boss.spiderlings[0];
        assert.ok(hazard.velX > 0);
    }
});


test('landing directly on the horse deals 40 damage once and knocks it clear', () => {
    const boss = new KrakenBoss(canvas, () => 0.5), p = player();
    let damage = 0;
    boss.health = 450;
    for (let i = 0; i < 110; i++) boss.update(p, [], amount => damage += amount, noop);
    assert.equal(damage, 40);
    assert.equal(p.velY, -7);
    assert.equal(p.isJumping, true);
    assert.ok(p.x > boss.x + boss.width);
    boss.update(p, [], amount => damage += amount, noop);
    assert.equal(damage, 40);
    const safeBoss = new KrakenBoss(canvas, () => 0.5);
    safeBoss.health = 450;
    for (let i = 0; i < 110; i++) safeBoss.update({ x: 450, y: 470, width: 120, height: 80 }, [], amount => damage += amount, noop);
    assert.equal(damage, 40, 'dodging the landing zone avoids stomp damage');
});
