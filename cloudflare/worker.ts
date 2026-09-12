import { parseScore } from '../api/score-input.ts';

interface Env {
    DB: D1Database;
    ASSETS: Fetcher;
    SCORE_LIMITER: RateLimit;
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
    return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

async function readBody(request: Request): Promise<unknown> {
    // Bound bytes as they arrive, including chunked requests without Content-Length.
    const reader = request.body?.getReader();
    if (!reader) throw new SyntaxError('Missing body');
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 4096) {
            await reader.cancel();
            throw new RangeError('Body too large');
        }
        chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder().decode(bytes));
}

export default {
    async fetch(request, env): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname.replace(/^\/robohorse(?=\/|$)/, '').replace(/\/$/, '') || '/';
        if (!path.startsWith('/api/')) {
            if (url.pathname === '/' || url.pathname === '/robohorse') {
                return Response.redirect(new URL('/robohorse/', url).toString(), 308);
            }
            return env.ASSETS.fetch(request);
        }
        try {
            if (path === '/api/health' && request.method === 'GET') {
                await env.DB.prepare('SELECT id FROM scores LIMIT 1').all();
                return json({ status: 'ok' });
            }
            const isScores = path === '/api/scores';
            if (!isScores && path !== '/api/scores/robohorse-v1') return json({ error: 'Not found' }, 404);
            if (request.method === 'GET') {
                const result = await env.DB.prepare(
                    'SELECT player_id AS name, score FROM scores WHERE game_id = ? ORDER BY score DESC, id ASC LIMIT 10'
                ).bind('robohorse-v1').all();
                return json(result.results);
            }
            if (!isScores || request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { Allow: isScores ? 'GET, POST' : 'GET' });
            const { success } = await env.SCORE_LIMITER.limit({ key: `scores:${request.headers.get('CF-Connecting-IP') || 'unknown'}` });
            if (!success) return json({ error: 'Too many score submissions' }, 429, { 'Retry-After': '60' });
            if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
                return json({ error: 'Invalid request body' }, 400);
            }
            let body;
            try { body = await readBody(request); }
            catch (error) { return json({ error: 'Invalid request body' }, error instanceof RangeError ? 413 : 400); }
            const score = parseScore(body);
            if (!score) return json({ error: 'Invalid score data' }, 400);
            await env.DB.prepare('INSERT INTO scores (game_id, player_id, score) VALUES (?, ?, ?)')
                .bind('robohorse-v1', score.name, score.score).run();
            return json({ message: 'Score saved successfully' }, 201);
        } catch (error) {
            console.error('Score database request failed', error);
            return json({ error: 'Internal server error' }, 500);
        }
    },
} satisfies ExportedHandler<Env>;
