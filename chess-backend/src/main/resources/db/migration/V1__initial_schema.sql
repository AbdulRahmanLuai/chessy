-- Users
CREATE TABLE users (
                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       email TEXT UNIQUE NOT NULL,
                       password_hash TEXT,
                       google_id TEXT UNIQUE,
                       display_name TEXT NOT NULL,
                       created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Friendships
CREATE TABLE friendships (
                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                             user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                             user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                             requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                             status TEXT NOT NULL CHECK (status IN ('PENDING', 'ACCEPTED')),
                             created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                             updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                             CONSTRAINT uq_friendships_users UNIQUE (user1_id, user2_id)
);

-- Indexes for friendship lookups
CREATE INDEX idx_friendships_user1 ON friendships(user1_id);
CREATE INDEX idx_friendships_user2 ON friendships(user2_id);

-- Games
CREATE TABLE games (
                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       white_player_id UUID REFERENCES users(id) ON DELETE SET NULL,
                       black_player_id UUID REFERENCES users(id) ON DELETE SET NULL,
                       status TEXT NOT NULL CHECK (status IN ('WAITING', 'IN_PROGRESS', 'COMPLETED', 'ABORTED'))
                                           DEFAULT 'WAITING',
                       current_fen TEXT NOT NULL
                                           DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                       moves JSONB NOT NULL DEFAULT '[]',
                       result TEXT,
                       result_reason TEXT,
                       time_initial_seconds INTEGER NOT NULL DEFAULT 600,
                       time_increment_seconds INTEGER NOT NULL DEFAULT 0,
                       white_time_remaining_ms BIGINT NOT NULL DEFAULT 600000,
                       black_time_remaining_ms BIGINT NOT NULL DEFAULT 600000,
                       last_move_at TIMESTAMPTZ,
                       current_player_deadline_at TIMESTAMPTZ,
                       created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                       finished_at TIMESTAMPTZ
);

-- Indexes for games
CREATE INDEX idx_games_white ON games(white_player_id);
CREATE INDEX idx_games_black ON games(black_player_id);
CREATE INDEX idx_games_sweeper ON games(current_player_deadline_at) WHERE status = 'IN_PROGRESS';