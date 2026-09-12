import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
// Upload only the Vite artifact, never the API, .env, or database exports.
await rm('.cloudflare/assets', { recursive: true, force: true });
await mkdir('.cloudflare/assets', { recursive: true });
await cp('deploy/robohorse', '.cloudflare/assets/robohorse', { recursive: true });
await writeFile('.cloudflare/assets/_headers', `/robohorse/assets/*
  Cache-Control: public, max-age=31536000, immutable
/robohorse/
  Cache-Control: no-cache
`);
