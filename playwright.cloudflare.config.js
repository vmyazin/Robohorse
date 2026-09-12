import { defineConfig } from '@playwright/test';
export default defineConfig({
    projects: [
        { name: 'game-on-workers', testDir: './e2e' },
        { name: 'd1-api', testDir: './cloudflare/e2e' },
    ],
    use: { baseURL: 'http://127.0.0.1:4282', headless: true },
    webServer: {
        command: 'node scripts/start-cloudflare-test.js',
        url: 'http://127.0.0.1:4282/api/health',
        reuseExistingServer: false,
        timeout: 60000,
    },
});
