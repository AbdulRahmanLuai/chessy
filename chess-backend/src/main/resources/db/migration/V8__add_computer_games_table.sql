CREATE TABLE computer_games (
                                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                                user_color TEXT NOT NULL CHECK (user_color IN ('WHITE', 'BLACK')),
                                status TEXT NOT NULL CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABORTED'))
                                                    DEFAULT 'IN_PROGRESS',
                                current_fen TEXT NOT NULL
                                                    DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                                moves JSONB NOT NULL DEFAULT '[]',
                                move_version INTEGER NOT NULL DEFAULT 0,
                                is_timed BOOLEAN NOT NULL,
                                difficulty TEXT NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')) DEFAULT 'EASY',
                                engine TEXT NOT NULL DEFAULT 'RANDOM',
                                result TEXT,
                                result_reason TEXT,
                                time_initial_seconds INTEGER,
                                time_increment_seconds INTEGER,
                                white_time_remaining_ms BIGINT,
                                black_time_remaining_ms BIGINT,
                                last_move_at TIMESTAMPTZ,
                                current_player_deadline_at TIMESTAMPTZ,
                                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                finished_at TIMESTAMPTZ,
                                CHECK (
                                    (is_timed = true AND time_initial_seconds IS NOT NULL AND time_increment_seconds IS NOT NULL)
                                        OR
                                    (is_timed = false AND time_initial_seconds IS NULL AND time_increment_seconds IS NULL)
                                    )
);

-- Supports createOrGetGame's lookup: "does this user have an in-progress game?"
CREATE INDEX idx_computer_games_user_id_status ON computer_games (user_id, status);

-- Supports findInProgressGamesAwaitingBotMove: narrows to IN_PROGRESS first,
-- since that's the more selective predicate; the turn-parity check on
-- user_color/moves runs against this smaller filtered set.
CREATE INDEX idx_computer_games_status_user_color ON computer_games (status, user_color) WHERE status = 'IN_PROGRESS';