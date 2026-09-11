import { test } from 'node:test';
import assert from 'node:assert/strict';
import EffectsManager from '../frontend/js/managers/EffectsManager.ts';
import { isColliding } from '../frontend/js/utils/helpers.ts';

test('effect drawing is read-only and simulation owns animation time', () => {
    const original = globalThis.Image;
    globalThis.Image = class { complete = true; naturalWidth = 150; };
    try {
        const effects = new EffectsManager({ canvas: { width: 1000, height: 600 }, soundManager: { playSound() {} } });
        effects.triggerElonToasty();
        const ctx = { drawImage() {}, fillRect() {} };
        for (let i = 0; i < 144; i++) effects.draw(ctx);
        assert.equal(effects.elonToasty.timer, 0);
        for (let i = 0; i < 10; i++) effects.update();
        assert.equal(effects.elonToasty.timer, 10);
        assert.ok(effects.elonToasty.x < 1000);
    } finally { globalThis.Image = original; }
});

test('collision bounds exclude touching edges and include overlap', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    assert.equal(isColliding(a, { ...a, x: 10 }), false);
    assert.equal(isColliding(a, { ...a, x: 9 }), true);
    assert.equal(isColliding(a, { ...a, y: 10 }), false);
});
