CREATE TABLE IF NOT EXISTS scores (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(6) NOT NULL,
    game_id TEXT NOT NULL DEFAULT 'robohorse-v1',
    score INTEGER NOT NULL CHECK (score >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Upgrade the original schema without deleting historical scores.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'scores' AND column_name = 'name')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'scores' AND column_name = 'player_id') THEN
        ALTER TABLE scores RENAME COLUMN name TO player_id;
    END IF;
END $$;
ALTER TABLE scores ADD COLUMN IF NOT EXISTS game_id TEXT NOT NULL DEFAULT 'robohorse-v1';
CREATE INDEX IF NOT EXISTS scores_game_score_idx ON scores (game_id, score DESC);

-- Enforce new writes while leaving historical rows available for an explicit audit.
ALTER TABLE scores ADD CONSTRAINT scores_nonnegative CHECK (score >= 0) NOT VALID;
ALTER TABLE scores ADD CONSTRAINT scores_player_name CHECK (length(btrim(player_id)) BETWEEN 1 AND 6) NOT VALID;
