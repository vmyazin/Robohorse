import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createD1Export } from '../api/db/export-d1.js';

test('D1 export preserves IDs, historical names, timestamps and ranking without overwriting rows', () => {
    const db = new DatabaseSync(':memory:');
    try {
        db.exec(readFileSync('cloudflare/migrations/0001_scores.sql', 'utf8'));
        const rows = [
            { id: 4, player_id: "O'NEIL", game_id: 'robohorse-v1', score: 90, created_at: '2025-01-01T12:00:00Z' },
            { id: 9, player_id: 'LEGACY NAME', game_id: 'robohorse-v1', score: 900, created_at: '2025-02-01T12:00:00Z' },
            { id: 10, player_id: 'OTHER', game_id: 'another-game', score: 999, created_at: '2025-03-01T12:00:00Z' },
        ];
        const { sql, report } = createD1Export(rows);
        db.exec(sql);
        assert.equal(report.rows, 3);
        assert.deepEqual(JSON.parse(JSON.stringify(db.prepare('SELECT player_id AS name, score FROM scores WHERE game_id = ? ORDER BY score DESC, id ASC LIMIT 10').all('robohorse-v1'))), report.top10);
        assert.equal(db.prepare('SELECT created_at FROM scores WHERE id = 4').get().created_at, '2025-01-01T12:00:00.000Z');
        assert.throws(() => db.exec(sql), /UNIQUE/);
        db.prepare('INSERT INTO scores (player_id, score) VALUES (?, ?)').run('NEW', 10);
        assert.equal(db.prepare('SELECT max(id) AS id FROM scores').get().id, 11);
    } finally { db.close(); }
});
