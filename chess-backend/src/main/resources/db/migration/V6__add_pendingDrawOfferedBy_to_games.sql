ALTER TABLE games
    ADD COLUMN pending_draw_offered_by UUID REFERENCES users(id) ON DELETE SET NULL;