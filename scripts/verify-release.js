import { mkdtemp, rm, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { release } from './release.js';

const destination = await mkdtemp(path.join(tmpdir(), 'robohorse-production-'));
let child;
try {
    await mkdir(path.join(destination, 'shared'));
    await writeFile(path.join(destination, 'shared/.env'), 'DATABASE_URL=postgres://test:test@127.0.0.1:1/test\n');
    const staged = await release({ source: process.cwd(), destination, prepare: async cwd => {
        const result = spawnSync('pnpm', ['install', '--prod', '--frozen-lockfile'], { cwd, stdio: 'inherit', env: { ...process.env, CI: 'true' } });
        if (result.status !== 0) throw new Error('Production install failed');
    }, activate: async () => {} });
    child = spawn(process.execPath, ['api/passenger_wrapper.cjs'], { cwd: staged, env: { ...process.env, PORT: '0', NODE_ENV: 'production' }, stdio: ['ignore', 'pipe', 'pipe'] });
    const port = await new Promise((resolve, reject) => {
        let output = '';
        child.once('error', reject);
        child.once('exit', code => reject(new Error(`Startup exited ${code}: ${output}`)));
        child.stdout.on('data', chunk => {
            output += chunk;
            const match = output.match(/listening on (\d+)/);
            if (match) resolve(match[1]);
        });
        child.stderr.on('data', chunk => { output += chunk; });
        setTimeout(() => reject(new Error('Startup timed out')), 10000).unref();
    });
    const base = `http://127.0.0.1:${port}`;
    const response = await fetch(`${base}/robohorse/`);
    assert.equal(response.status, 200);
    const html = await response.text();
    const asset = html.match(/src="(\/robohorse\/assets\/[^\"]+\.js)"/)[1];
    const javascript = await fetch(base + asset);
    assert.equal(javascript.status, 200);
    assert.match(javascript.headers.get('cache-control'), /immutable/);
    assert.equal((await fetch(`${base}/api/health`)).status, 200);
    assert.equal((await fetch(`${base}/api/app.js`)).status, 404);
    assert.ok(!(await readFile(path.join(staged, asset.replace('/robohorse/', 'deploy/robohorse/')), 'utf8')).includes('window.__game='));
    console.log('Production-only release install, Passenger startup, HTML, hashed assets, caching and source protection verified.');
} finally {
    if (child && child.exitCode === null) {
        child.kill();
        await new Promise(resolve => child.once('exit', resolve));
    }
    await rm(destination, { recursive: true });
}
