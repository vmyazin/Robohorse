import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { deployFrontend } from '../scripts/deploy-frontend.js';

test('frontend sync preserves backend and configuration while deleting stale assets', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'robohorse-deploy-'));
    try {
        const source = path.join(root, 'source');
        const destination = path.join(root, 'destination');
        await mkdir(source);
        await mkdir(destination);
        for (const dir of ['api', 'node_modules', 'tmp']) {
            await mkdir(path.join(destination, dir));
            await writeFile(path.join(destination, dir, 'keep'), 'protected');
        }
        for (const file of ['.env', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', '.node-version']) await writeFile(path.join(destination, file), 'protected');
        await writeFile(path.join(destination, 'stale.js'), 'obsolete');
        await writeFile(path.join(source, 'index.html'), 'new build');
        deployFrontend(`${source}/`, `${destination}/`);
        for (const file of ['api/keep', 'node_modules/keep', 'tmp/keep', '.env', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', '.node-version']) {
            assert.equal(await readFile(path.join(destination, file), 'utf8'), 'protected');
        }
        assert.equal(await readFile(path.join(destination, 'index.html'), 'utf8'), 'new build');
        await assert.rejects(readFile(path.join(destination, 'stale.js')), { code: 'ENOENT' });
    } finally { await rm(root, { recursive: true }); }
});

for (const entry of ['api/server.js', 'api/passenger_wrapper.cjs']) {
    test(`${entry} starts in production and protects source files`, { timeout: 15000 }, async () => {
        const child = spawn(process.execPath, [entry], {
            env: { ...process.env, NODE_ENV: 'production', PORT: '0', DATABASE_URL: 'postgres://test:test@127.0.0.1:1/test' },
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        let output = '';
        try {
            const port = await new Promise((resolve, reject) => {
                child.once('error', reject);
                child.once('exit', code => reject(new Error(`Exited ${code}: ${output}`)));
                child.stdout.on('data', chunk => {
                    output += chunk;
                    const match = output.match(/(?:port |listening on )(\d+)/);
                    if (match) resolve(match[1]);
                });
                child.stderr.on('data', chunk => { output += chunk; });
            });
            const base = `http://127.0.0.1:${port}`;
            assert.equal((await fetch(`${base}/api/health`)).status, 200);
            for (const url of ['/api/app.js', '/package.json', '/.env', '/robohorse/api/app.js']) {
                assert.equal((await fetch(base + url)).status, 404, url);
            }
            const failure = await fetch(`${base}/api/scores`);
            assert.equal(failure.status, 500);
            assert.deepEqual(await failure.json(), { error: 'Internal server error' });
            const invalid = await fetch(`${base}/api/scores`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
            assert.equal(invalid.status, 400);
            const oversized = await fetch(`${base}/api/scores`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'A'.repeat(5000) }) });
            assert.equal(oversized.status, 413);
            if (entry.endsWith('server.js')) assert.equal((await fetch(base)).status, 200);
        } finally { child.kill(); }
    });
}
