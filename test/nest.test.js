import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CephalopodNest, maybeStartNest, updateNestScroll, updateNest } from '../frontend/js/managers/NestEncounter.js';
const canvas = { width: 1000, height: 600 };
const noop = () => {};
function host() {
    return { canvas, gameSpeed: 1, levelManager: { levelPosition: 2200, scrollSpeed: 1.2 }, player: { x: 100, y: 470, width: 120, height: 80, specialAbilityTokens: 0, maxSpecialAbilityTokens: 3 },
        obstacles: [{}], platforms: [{}], enemies: [], projectiles: [], score: 0, frameCount: 1,
        createParticles: noop, soundManager: { playSound: noop }, scoreDisplay: {}, specialTokensDisplay: {}, showLevelAnnouncement: noop };
}
test('nest warns before each attack, alternates patterns and caps hatchlings', () => {
    const g = host(), n = new CephalopodNest(canvas);
    n.update(g, 119); assert.equal(g.enemies.length, 0);
    n.update(g); assert.equal(g.enemies.length, 2); assert.equal(n.phase, 'exposed');
    n.update(g, 210); assert.equal(n.phase, 'shielded');
    n.update(g, 60); assert.equal(n.phase, 'warning');
    n.update(g, 89); assert.equal(g.projectiles.length, 0);
    n.update(g); assert.equal(g.projectiles.length, 3);
    for (let i = 0; i < 20; i++) { n.update(g, 210); n.update(g, 60); n.update(g, 90); }
    assert.ok(g.enemies.length <= 6);
});
test('only player shots on an exposed core cause damage', () => {
    const n = new CephalopodNest(canvas), shot = { ...n.core, damage: 30, isPlayerProjectile: true };
    assert.equal(n.hit(shot), true); assert.equal(n.health, 240);
    n.phase = 'exposed';
    assert.equal(n.hit({ ...shot, x: n.x - 2, width: 8 }), false, 'open shell lets incoming shots reach the core');
    n.hit({ ...shot, isPlayerProjectile: false }); assert.equal(n.health, 240);
    n.hit({ ...shot, x: n.x, y: n.y, width: 5, height: 5 }); assert.equal(n.health, 240);
    n.hit(shot); assert.equal(n.health, 210);
});
test('entry and destruction preserve combat and scenery, reward once and do not teleport', () => {
    const g = host(), platforms = g.platforms, obstacles = g.obstacles;
    const enemy = { x: 400 }, shot = { x: 20, y: 20, width: 5, height: 5, isPlayerProjectile: false };
    g.enemies.push(enemy); g.projectiles.push(shot);
    const before = { ...g.player };
    maybeStartNest(g); assert.ok(g.nest); assert.equal(g.platforms, platforms);
    assert.deepEqual(g.player, before); assert.ok(g.enemies.includes(enemy)); assert.ok(g.projectiles.includes(shot));
    g.nest.phase = 'exposed';
    g.projectiles.push({ ...g.nest.core, damage: 999, isPlayerProjectile: true });
    updateNest(g); assert.equal(g.nest, null); assert.equal(g.score, 750);
    assert.equal(g.player.specialAbilityTokens, 1); assert.equal(g.platforms, platforms); assert.equal(g.obstacles, obstacles);
    assert.deepEqual({ x: g.player.x, y: g.player.y }, { x: before.x, y: before.y });
    assert.ok(g.enemies.includes(enemy)); assert.ok(g.projectiles.includes(shot));
    updateNest(g); maybeStartNest(g); assert.equal(g.score, 750); assert.equal(g.nest, null);
});

test('scrolling smoothly brakes and accelerates while the nest shares world travel', () => {
    const g = host(); maybeStartNest(g);
    const startX = g.nest.x;
    let last = 1, travel = 0;
    for (let tick = 0; tick < 240; tick++) {
        updateNestScroll(g);
        assert.ok(g.scrollFactor <= last);
        assert.ok(last - g.scrollFactor < 0.007);
        travel += 1.2 * g.scrollFactor; last = g.scrollFactor;
        if (tick < 239) { updateNest(g); assert.equal(g.nest.tick, 0); }
    }
    assert.equal(g.scrollFactor, 0);
    assert.ok(Math.abs(g.nest.x - (startX - travel)) < 1e-8);
    const stopped = g.scrollFrame;
    updateNestScroll(g); assert.equal(g.scrollFrame, stopped);
    g.nest.phase = 'exposed'; g.projectiles.push({ ...g.nest.core, damage: 999, isPlayerProjectile: true });
    updateNest(g); assert.equal(g.scrollFactor, 0);
    for (let tick = 0; tick < 240; tick++) {
        updateNestScroll(g); assert.ok(g.scrollFactor >= last);
        assert.ok(g.scrollFactor - last < 0.007); last = g.scrollFactor;
    }
    assert.equal(g.scrollFactor, 1); assert.equal(g.nestTransition, null);
});
