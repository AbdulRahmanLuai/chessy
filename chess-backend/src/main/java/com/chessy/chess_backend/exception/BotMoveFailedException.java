package com.chessy.chess_backend.exception;

import java.util.UUID;

public class BotMoveFailedException extends RuntimeException {

    private final UUID gameId;

    public BotMoveFailedException(UUID gameId, String message, Throwable cause) {
        super(message, cause);
        this.gameId = gameId;
    }

    public UUID getGameId() {
        return gameId;
    }
}