-- Migration: Add composite indexes for active game lookups and remove redundant single-column indexes

-- 1. Drop the old, redundant single-column indexes
DROP INDEX IF EXISTS idx_games_white;
DROP INDEX IF EXISTS idx_games_black;

-- 2. Create the optimized composite indexes
CREATE INDEX idx_games_white_status ON games (white_player_id, status);
CREATE INDEX idx_games_black_status ON games (black_player_id, status);