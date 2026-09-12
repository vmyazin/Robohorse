import { test } from 'node:test';
import assert from 'node:assert/strict';
import Background, { districtAtFrame } from '../frontend/js/components/Background.js';

test('district route holds, dissolves smoothly, visits every district and wraps', () => {
    for (let district = 0; district < 4; district++) {
        const start = district * 16 * 60;
        assert.equal(districtAtFrame(start).current, district);
        assert.equal(districtAtFrame(start + 12 * 60).blend, 0);
        assert.equal(districtAtFrame(start + 14 * 60).blend, 0.5);
        assert.ok(districtAtFrame(start + 16 * 60 - 1).blend > 0.999);
        assert.equal(districtAtFrame(start).next, (district + 1) % 4);
    }
    assert.equal(districtAtFrame(64 * 60).current, 0);
    assert.equal(districtAtFrame(64 * 60).blend, 0);
    assert.deepEqual(districtAtFrame(0), { time: 0, current: 0, next: 1, blend: 0 });
});


test('new games can start anywhere in the cycle without changing simulation time', () => {
    const state = { startFrame: 0 };
    for (const [random, expected] of [[0, 0], [0.25, 960], [0.625, 2400], [0.99999, 3839]]) {
        Background.prototype.reset.call(state, () => random);
        assert.equal(state.startFrame, expected);
    }
});
