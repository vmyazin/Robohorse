import { rmSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
rmSync('.wrangler/test-state', { recursive: true, force: true });
for (const args of [
    ['exec', 'vite', 'build', '--mode', 'test'],
    ['exec', 'node', 'scripts/build-cloudflare.js'],
    ['exec', 'wrangler', 'd1', 'migrations', 'apply', 'DB', '--local', '--persist-to', '.wrangler/test-state'],
]) {
    const result = spawnSync('pnpm', args, { stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status || 1);
}
const child = spawn('pnpm', ['exec', 'wrangler', 'dev', '--port', '4282', '--persist-to', '.wrangler/test-state'], { stdio: 'inherit' });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
child.on('exit', code => process.exit(code || 0));
