import { defineConfig } from '@playwright/test';
export default defineConfig({
    testDir: './e2e',
    use: { baseURL: 'http://127.0.0.1:4281', headless: true },
    webServer: {
        command: 'pnpm exec vite build --mode test && node api/server.js',
        env: { PORT: '4281', NODE_ENV: 'production' },
        url: 'http://127.0.0.1:4281/api/health',
        reuseExistingServer: false,
    },
});
