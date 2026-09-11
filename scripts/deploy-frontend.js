import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function deployFrontend(source, destination) {
    const result = spawnSync('rsync', [
        '-avz', '--delete',
        // Excluded paths are protected from receiver-side deletion as well.
        '--exclude=/package.json', '--exclude=/pnpm-lock.yaml', '--exclude=/pnpm-workspace.yaml', '--exclude=/.node-version',
        '--exclude=/api/', '--exclude=/.env', '--exclude=/node_modules/', '--exclude=/tmp/',
        source, destination,
    ], { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Frontend deployment failed (${result.status})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    deployFrontend('deploy/robohorse/', 'apprunner@games.smoxu.com:/var/www/games.smoxu.com/robohorse/');
}
