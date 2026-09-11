export interface ScoreEntry { name: string; score: number }
export interface ScoreSubmission { name: string; score: number }

export default class ScoreService {
    private endpoint: string;
    private request: typeof fetch;

    constructor(endpoint: string, request: typeof fetch = fetch) {
        this.endpoint = endpoint;
        this.request = request.bind(globalThis);
    }

    async list(): Promise<ScoreEntry[]> {
        const response = await this.request(this.endpoint, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error('Failed to fetch scores');
        const data: unknown = await response.json();
        if (!Array.isArray(data) || data.length > 10 || !data.every(row =>
            row && typeof row.name === 'string' && Number.isInteger(row.score) && row.score >= 0)) {
            throw new Error('Invalid leaderboard response');
        }
        return data;
    }

    async save(submission: ScoreSubmission): Promise<void> {
        const response = await this.request(this.endpoint, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submission), signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw new Error(response.status === 429 ? 'Please wait before saving another score' : 'Failed to save score');
    }
}
