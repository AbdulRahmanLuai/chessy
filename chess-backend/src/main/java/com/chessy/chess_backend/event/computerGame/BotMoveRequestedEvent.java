package com.chessy.chess_backend.event.computerGame;

import java.util.UUID;

public record BotMoveRequestedEvent (UUID gameId) {

    public UUID getGameId() {
        return gameId;
    }
}