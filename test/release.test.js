import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readlink, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { release } from '../scripts/release.js';

test('release switches only after preparation and rolls back failed activation', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'robohorse-release-'));
    const source = path.join(root, 'source');
    const destination = path.join(root, 'host');
    try {
        await mkdir(path.join(source, 'api'), { recursive: true });
        await mkdir(path.join(source, 'deploy/robohorse'), { recursive: true });
        for (const file of ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', '.node-version', 'api/server.js', 'deploy/robohorse/index.html']) await writeFile(path.join(source, file), 'fixture');
        const first = await release({ source, destination, prepare: async () => {}, activate: async () => {} });
        const current = path.join(destination, 'current');
        assert.equal(await readlink(current), first);
        await assert.rejects(release({ source, destination, prepare: async () => { throw new Error('migration failed'); }, activate: async () => assert.fail() }), /migration failed/);
        assert.equal(await readlink(current), first);
        let activations = 0;
        await assert.rejects(release({ source, destination, prepare: async staged => {
            assert.equal(await readlink(current), first);
            assert.equal(await readFile(path.join(staged, 'api/server.js'), 'utf8'), 'fixture');
        }, activate: async () => { if (++activations === 1) throw new Error('restart failed'); } }), /restart failed/);
        assert.equal(await readlink(current), first);
        assert.equal(activations, 2);
    } finally { await rm(root, { recursive: true }); }
});
