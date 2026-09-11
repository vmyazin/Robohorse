import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { migrate } from '../api/db/migrate.js';

for (const legacy of [false, true]) {
    test(`migrations preserve scores and are repeatable (${legacy ? 'legacy' : 'fresh'})`, async () => {
        const db = new PGlite();
        const pool = { connect: async () => ({
            query: (sql, args) => args ? db.query(sql, args) : db.exec(sql).then(results => results[0]),
            release() {},
        }) };
        try {
            if (legacy) {
                await db.exec("CREATE TABLE scores (id SERIAL PRIMARY KEY, name VARCHAR(6) NOT NULL, score INTEGER NOT NULL, created_at TIMESTAMPTZ DEFAULT now()); INSERT INTO scores(name,score) VALUES ('OLD',42)");
            }
            await migrate(pool);
            await migrate(pool);
            assert.equal((await db.query('SELECT * FROM schema_migrations')).rows.length, 1);
            if (legacy) assert.deepEqual((await db.query('SELECT player_id, game_id, score FROM scores')).rows, [{ player_id: 'OLD', game_id: 'robohorse-v1', score: 42 }]);
            await db.query('INSERT INTO scores (player_id,game_id,score) VALUES ($1,$2,$3)', ['NEW','robohorse-v1',99]);
            assert.equal((await db.query("SELECT player_id FROM scores WHERE game_id = 'robohorse-v1' ORDER BY score DESC LIMIT 10")).rows[0].player_id, 'NEW');
            await assert.rejects(db.query("INSERT INTO scores(player_id,score) VALUES ('BAD',-1)"));
            await assert.rejects(db.query("INSERT INTO scores(player_id,score) VALUES (' ',1)"));
            assert.equal((await db.query("SELECT indexname FROM pg_indexes WHERE indexname = 'scores_game_score_idx'")).rows.length, 1);
        } finally { await db.close(); }
    });
}
