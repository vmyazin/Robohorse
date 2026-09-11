import { defineConfig } from 'vite';
import { cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const at = relative => fileURLToPath(new URL(relative, import.meta.url));
export default defineConfig({
    root: at('./frontend/'),
    base: '/robohorse/',
    publicDir: false,
    server: {
        proxy: { '/api': 'http://localhost:4270', '/robohorse/api': 'http://localhost:4270' },
    },
    build: {
        outDir: at('./deploy/robohorse/'),
        emptyOutDir: true,
        rollupOptions: { input: {
            main: at('./frontend/index.html'),
            playtest: at('./frontend/playtest.html'),
            scoreboard: at('./frontend/scoreboard.html'),
        } },
    },
    plugins: [{
        name: 'game-media',
        async closeBundle() {
            for (const directory of ['audio', 'images']) {
                await cp(at(`./frontend/${directory}`), at(`./deploy/robohorse/${directory}`), { recursive: true });
            }
        },
    }],
});
