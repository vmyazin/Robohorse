import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// Exercise the actual transitive dependency used by Express.
const require = createRequire(import.meta.url);
const qs = createRequire(require.resolve('express'))('qs');

test('qs comma encoding accepts null and undefined array entries', () => {
    const options = { arrayFormat: 'comma', encodeValuesOnly: true };
    assert.equal(qs.stringify({ a: [null, 'b'] }, options), 'a=,b');
    assert.equal(qs.stringify({ a: [undefined, 'b'] }, options), 'a=,b');
    assert.equal(qs.stringify({ a: [null] }, options), 'a=');
    assert.equal(qs.stringify({ a: [null] }, { ...options, skipNulls: true }), '');
    assert.equal(qs.stringify({ a: [null] }, { ...options, strictNullHandling: true }), 'a');
});
