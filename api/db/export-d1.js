import pg from 'pg';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const quote = value => "'" + String(value).replaceAll("'", "''") + "'";
export function createD1Export(rows) {
    const statements = rows.map(row => {
        if (!Number.isSafeInteger(row.id) || !Number.isSafeInteger(row.score) ||
            typeof row.player_id !== 'string' || typeof row.game_id !== 'string' ||
            [row.player_id, row.game_id].some(value => value.includes('\0')) ||
            row.created_at == null || !Number.isFinite(new Date(row.created_at).getTime())) {
            throw new Error(`Cannot export score ID ${row.id}; audit this historical row before migration`);
        }
        return `INSERT INTO scores (id, player_id, game_id, score, created_at) VALUES (${row.id}, ${quote(row.player_id)}, ${quote(row.game_id)}, ${row.score}, ${quote(new Date(row.created_at).toISOString())});`;
    });
    const sql = '-- Historical scores: import into an empty D1 scores table before accepting writes.\n' + statements.join('\n') + '\n';
    return { sql, report: {
        rows: rows.length,
        sqlSha256: createHash('sha256').update(sql).digest('hex'),
        top10: rows.filter(row => row.game_id === 'robohorse-v1').sort((a, b) => b.score - a.score || a.id - b.id)
            .slice(0, 10).map(row => ({ name: row.player_id, score: row.score })),
    } };
}

async function main() {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
    const output = process.argv[2];
    if (!output) throw new Error('Provide a new output directory, e.g. score-export/final');
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
    await client.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
        const { rows: columns } = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'scores'");
        const names = new Set(columns.map(row => row.column_name));
        const player = names.has('player_id') ? 'player_id' : 'name';
        const game = names.has('game_id') ? 'game_id' : "'robohorse-v1'";
        const { rows } = await client.query(`SELECT id, ${player} AS player_id, ${game} AS game_id, score, created_at FROM scores ORDER BY id`);
        const { sql, report } = createD1Export(rows);
        await client.query('COMMIT');
        await mkdir(output, { recursive: false });
        await writeFile(path.join(output, 'scores.sql'), sql, { flag: 'wx', mode: 0o600 });
        await writeFile(path.join(output, 'verification.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
        console.log(`Exported ${report.rows} scores to ${output}. Source database was not changed.`);
    } finally { await client.end(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
