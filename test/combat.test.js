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

function stompFixture() {
    const host = fixture();
    host.player.y = 15;
    host.player.velY = 10;
    const enemy = { x: 10, y: 20, width: 20, height: 10, health: 50,
        takeDamage(damage) { this.health -= damage; return this.health <= 0; } };
    return { host, enemy, combat: new CombatSystem(host), previous: { ...host.player, y: 0 } };
}

test('stomping from above damages once and bounces without harming the player', () => {
    const { host, enemy, combat, previous } = stompFixture();
    assert.deepEqual(combat.stompEnemy(enemy, previous, enemy), { dead: false });
    assert.equal(enemy.health, 20);
    assert.equal(host.player.health, 10);
    assert.equal(host.player.y + host.player.height, enemy.y);
    assert.equal(host.player.velY, -8);
    assert.equal(host.player.isJumping, true);
    assert.equal(combat.stompEnemy(enemy, previous, enemy), null);
    assert.equal(enemy.health, 20);
});

test('powered stomp doubles damage and fast falls cannot tunnel through an enemy', () => {
    const { host, enemy, combat, previous } = stompFixture();
    host.player.mushroomPowerActive = true;
    host.player.y = 50;
    assert.deepEqual(combat.stompEnemy(enemy, previous, enemy), { dead: true });
    assert.equal(enemy.health, -10);
    assert.equal(host.player.mushroomPowerActive, true);
});

test('side, underside and horizontally missed contacts are not stomps', () => {
    for (const scenario of ['side', 'under', 'miss']) {
        const { host, enemy, combat, previous } = stompFixture();
        if (scenario === 'side') previous.y = 15;
        if (scenario === 'under') host.player.velY = -5;
        if (scenario === 'miss') previous.x = host.player.x = 80;
        assert.equal(combat.stompEnemy(enemy, previous, enemy), null, scenario);
        assert.equal(enemy.health, 50);
    }
});

test('stomp checks horizontal overlap at impact rather than only at the end of a tick', () => {
    const { host, enemy, combat, previous } = stompFixture();
    previous.x = 0; host.player.x = 90; host.player.y = 40;
    // Impact is one quarter through the fall, while the horse overlaps the enemy.
    assert.deepEqual(combat.stompEnemy(enemy, previous, enemy), { dead: false });
});

test('stomping a weapon crate releases its weapon pickup', () => {
    const host = fixture();
    const drops = [];
    host.spawnPowerUp = (x, y, type) => drops.push({ x, y, type });
    const box = { x: 10, y: 12, width: 20, height: 20, type: 'box', points: 50, color: '#fff', containsWeapon: true };
    host.obstacles.push(box);
    new CombatSystem(host).collide(box);
    assert.deepEqual(drops, [{ x: 10, y: -8, type: 'weapon' }]);
    assert.equal(host.obstacles.length, 0);
});
