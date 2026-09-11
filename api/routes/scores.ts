import { Router } from 'express';

export interface ScoreDatabase {
    query(sql: string, values: (string | number)[]): Promise<{ rows: { name: string; score: number }[] }>;
}

export function createScoreRouter(pool: ScoreDatabase, { limit = 10, windowMs = 60000, now = Date.now } = {}) {
    const router = Router();
    const clients = new Map<string, { count: number; until: number }>();
    router.get(['/', '/robohorse-v1'], async (req, res, next) => {
        try {
            const result = await pool.query('SELECT player_id as name, score FROM scores WHERE game_id = $1 ORDER BY score DESC LIMIT 10', ['robohorse-v1']);
            res.json(result.rows);
        } catch (error) { next(error); }
    });
    router.post('/', async (req, res, next) => {
        const time = now();
        for (const [key, value] of clients) if (value.until <= time) clients.delete(key);
        const key = req.ip || 'unknown';
        const state = clients.get(key) || { count: 0, until: time + windowMs };
        if (state.count >= limit || (!clients.has(key) && clients.size >= 10000)) {
            res.set('Retry-After', String(Math.max(1, Math.ceil((state.until - time) / 1000))));
            return res.status(429).json({ error: 'Too many score submissions' });
        }
        state.count++;
        clients.set(key, state);
        const body = req.body;
        if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ error: 'Invalid score data' });
        const { name, score } = body;
        const value = typeof score === 'string' && /^\d+$/.test(score) ? Number(score) : score;
        if (typeof name !== 'string' || !/^[A-Za-z0-9_ ]{1,6}$/.test(name) || !name.trim() ||
            !Number.isInteger(value) || value < 0 || value > 2147483647 ||
            Object.keys(body).some(key => !['name', 'score'].includes(key))) {
            return res.status(400).json({ error: 'Invalid score data' });
        }
        try {
            await pool.query('INSERT INTO scores (game_id, player_id, score) VALUES ($1, $2, $3)', ['robohorse-v1', name.trim(), value]);
            res.status(201).json({ message: 'Score saved successfully' });
        } catch (error) { next(error); }
    });
    return router;
}
