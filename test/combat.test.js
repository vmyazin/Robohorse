import { test } from 'node:test';
import assert from 'node:assert/strict';
import CombatSystem from '../frontend/js/managers/CombatSystem.ts';

function fixture() {
    return {
        player: { x: 10, y: 0, width: 10, height: 10, velY: 2, health: 10, isJumping: true, standingOnObstacle: null, checkBoxSmash: () => true },
        obstacles: [], score: 0, drops: 0, ended: false,
        createParticles() {}, updateHealthDisplay() {},
        spawnMushroomPowerUp() { this.drops++; },
        effectsManager: { triggerDamageFlash() {} },
        endGame() { this.ended = true; },
    };
}

test('box landing awards points and drops once, clearing destroyed support', () => {
    const host = fixture();
    const box = { x: 10, y: 12, width: 20, height: 20, type: 'box', points: 50, color: '#fff', containsMushroom: true };
    host.obstacles.push(box);
    new CombatSystem(host).collide(box);
    assert.equal(host.score, 50);
    assert.equal(host.drops, 1);
    assert.equal(host.obstacles.length, 0);
    assert.equal(host.player.standingOnObstacle, null);
    assert.equal(host.player.velY, 0);
});

test('crushing clamps health and triggers game over', () => {
    const host = fixture();
    host.player.health = 1;
    new CombatSystem(host).crush();
    assert.equal(host.player.health, 0);
    assert.equal(host.ended, true);
});
