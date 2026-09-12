-- Preserve historical rows as-is; new submissions are validated by the Worker.
CREATE TABLE scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    game_id TEXT NOT NULL DEFAULT 'robohorse-v1',
    score INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX scores_game_score_idx ON scores (game_id, score DESC, id ASC);
