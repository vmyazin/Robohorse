/** Shared API contract for the legacy server and the Cloudflare Worker. */
export function parseScore(body: unknown): { name: string; score: number } | null {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
    const input = body as Record<string, unknown>;
    const { name, score } = input;
    const value = typeof score === 'string' && /^\d+$/.test(score) ? Number(score) : score;
    if (typeof name !== 'string' || !/^[A-Za-z0-9_ ]{1,6}$/.test(name) || !name.trim() ||
        typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 2147483647 ||
        Object.keys(input).some(key => !['name', 'score'].includes(key))) return null;
    return { name: name.trim(), score: value };
}
