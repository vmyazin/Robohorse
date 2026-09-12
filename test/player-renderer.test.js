import { test } from 'node:test';
import assert from 'node:assert/strict';
import Player from '../frontend/js/entities/Player.js';
import { getArtBounds, getHorsePose, getLegPose } from '../frontend/js/components/PlayerRenderer.js';

const weapons = [
    { name: 'GLOWING CANNON', color: '#ffffff', damage: 15, fireRate: 15, projectileSpeed: 10, width: 10, height: 10, isGlowing: true },
    { name: 'ROBOHORSE CANNON', color: '#0f0', damage: 30, fireRate: 30, projectileSpeed: 10, width: 10, height: 4 },
];
const player = () => new Player({ width: 1000, height: 600 }, weapons);
const noop = () => {};
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test('shots and special bursts emerge at the rendered muzzle in both directions and sizes', () => {
    for (const direction of [-1, 1]) for (const grown of [false, true]) {
        const p = player(); p.direction = direction;
        if (grown) { p.width = 180; p.height = 120; }
        p.appearance.phase = 2; p.appearance.stride = 1;
        const shots = [], particles = [];
        assert.equal(p.shoot(60, shots, (...args) => particles.push(args), noop), true);
        const muzzle = p.getMuzzlePosition();
        close(shots[0].x + (direction < 0 ? shots[0].width : 0), muzzle.x);
        close(shots[0].y + shots[0].height / 2, muzzle.y);
        close(particles[0][0], muzzle.x); close(particles[0][1], muzzle.y);
        assert.equal(Math.sign(shots[0].velX), direction);
        assert.equal(p.shoot(61, shots, noop, noop), false);
        p.specialAbilityTokens = 1;
        p.specialAbility(70, shots, noop, noop);
        assert.equal(shots.length, 6);
        for (const shot of shots.slice(1)) {
            close(shot.x + (direction < 0 ? shot.width : 0), p.getMuzzlePosition().x);
            close(shot.y + shot.height / 2, p.getMuzzlePosition().y);
        }
    }
});

test('grounded gait maintains a supporting foot and never sinks hooves below the floor', () => {
    const p = player(); p.appearance.stride = 1;
    for (let step = 0; step < 120; step++) {
        p.appearance.phase = step / 120 * Math.PI * 2;
        const pose = getHorsePose(p);
        let planted = 0;
        for (let i = 0; i < 3; i++) for (const far of [false, true]) {
            const leg = getLegPose(i, far, pose);
            const sole = leg.ankle[1] + pose.bob + 12;
            assert.ok(sole <= 252 + 1e-8);
            if (Math.abs(sole - 252) < 1e-8) planted++;
            assert.ok(leg.knee.every(Number.isFinite));
        }
        assert.ok(planted >= 3);
    }
    p.isJumping = true; p.velY = -5;
    const pose = getHorsePose(p);
    assert.ok(getLegPose(0, false, pose).ankle[1] < 240);
});

test('landing and hurt feedback advance on simulation ticks', () => {
    const p = player(); p.isJumping = true; p.velY = -4;
    p.updateAppearance();
    p.isJumping = false; p.velY = 0; p.health = 90;
    p.updateAppearance();
    assert.equal(p.appearance.landing, 1);
    assert.equal(p.appearance.hurt, 1);
    for (let i = 0; i < 20; i++) p.updateAppearance();
    assert.equal(p.appearance.landing, 0);
    assert.equal(p.appearance.hurt, 0);
});

test('growth and shrinking keep feet anchored and reset restores base bounds', () => {
    const p = player(); p.y = 470;
    p.activateMushroomPower(noop);
    for (let i = 0; i < 30; i++) p.updateGrowthAnimation(noop);
    assert.equal(p.mushroomPowerActive, true);
    assert.equal(p.width, 180); assert.equal(p.height, 120);
    close(p.y + p.height, 550);
    const grown = getArtBounds(p);
    close(grown.width / grown.height, 1.5);
    p.deactivateMushroomPower(noop);
    assert.equal(p.isShrinking, true);
    close(p.y + p.height, 550);
    close(getArtBounds(p).width, grown.width);
    for (let i = 0; i < 25; i++) p.updateShrinkAnimation(noop);
    assert.equal(p.isShrinking, false);
    assert.equal(getArtBounds(p).width, 120);
    p.width = 180; p.height = 120; p.appearance.recoil = 1;
    p.reset();
    assert.equal(p.width, 120); assert.equal(p.height, 80);
    assert.equal(p.appearance.recoil, 0);
});
