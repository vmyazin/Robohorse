import { mkdir, cp, symlink, rename, readlink, lstat, unlink, rmdir, access } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

function run(command, args, cwd) {
    const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`${command} failed (${result.status})`);
}

export async function release(options) {
    await mkdir(options.destination, { recursive: true });
    const lock = path.join(options.destination, '.release-lock');
    await mkdir(lock);
    try { return await releaseLocked(options); }
    finally { await rmdir(lock); }
}

async function releaseLocked({ source, destination, prepare, activate }) {
    const current = path.join(destination, 'current');
    let previous;
    try {
        if (!(await lstat(current)).isSymbolicLink()) throw new Error('current must be a symlink');
        previous = await readlink(current);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const id = randomUUID();
    const staged = path.join(destination, 'releases', id);
    await mkdir(staged, { recursive: true });
    for (const file of ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', '.node-version']) {
        await cp(path.join(source, file), path.join(staged, file));
    }
    await cp(path.join(source, 'api'), path.join(staged, 'api'), {
        recursive: true,
        filter: file => !['node_modules', '.env'].includes(path.basename(file)),
    });
    await cp(path.join(source, 'deploy/robohorse'), path.join(staged, 'deploy/robohorse'), { recursive: true });
    await symlink(path.join(destination, 'shared/.env'), path.join(staged, '.env'));
    await prepare(staged);
    const next = path.join(destination, `.next-${id}`);
    await symlink(staged, next);
    await rename(next, current);
    try {
        await activate(current);
    } catch (error) {
        if (previous) {
            await symlink(previous, next);
            await rename(next, current);
            await activate(current);
        } else {
            await unlink(current);
        }
        throw error;
    }
    return staged;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const destination = process.env.ROBOHORSE_RELEASE_ROOT;
    if (!destination || !path.isAbsolute(destination)) throw new Error('Set an absolute ROBOHORSE_RELEASE_ROOT');
    await access(path.join(destination, 'shared/.env'));
    const healthUrl = process.env.ROBOHORSE_HEALTH_URL;
    if (!healthUrl) throw new Error('Set ROBOHORSE_HEALTH_URL to the deployed /api/health endpoint');
    await release({
        source: process.cwd(), destination,
        prepare: async staged => {
            run('pnpm', ['install', '--prod', '--frozen-lockfile'], staged);
            run('node', ['api/db/setup.js'], staged);
        },
        activate: async current => {
            run('passenger-config', ['restart-app', path.join(current, 'api')], current);
            const response = await fetch(healthUrl, { signal: AbortSignal.timeout(15000) });
            if (!response.ok || (await response.json()).status !== 'ok') throw new Error('Release health check failed');
        },
    });
}
