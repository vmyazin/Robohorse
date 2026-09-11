import { test } from 'node:test';
import assert from 'node:assert/strict';
import Hud from '../frontend/js/components/Hud.ts';

test('HUD renders health boundaries without changing game state or rewriting unchanged text', () => {
    const elements = new Map();
    let writes = 0;
    for (const id of ['score', 'health-bar', 'health-value', 'weapon', 'special-tokens']) {
        elements.set(id, { style: {}, set textContent(value) { this.value = value; writes++; } });
    }
    const hud = new Hud({ getElementById: id => elements.get(id) });
    const state = Object.freeze({ score: 100, health: -5, maxHealth: 100, weapon: 'CANNON', tokens: 2, playing: true });
    hud.render(state);
    assert.equal(elements.get('health-bar').style.width, '0%');
    assert.equal(elements.get('health-value').value, '0');
    const initialWrites = writes;
    hud.render(state);
    assert.equal(writes, initialWrites);
    hud.render({ ...state, health: 70 });
    assert.equal(elements.get('health-bar').style.width, '70%');
    assert.equal(elements.get('health-value').value, '70');
});
