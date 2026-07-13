package com.chessy.chess_backend.exception;

import java.util.UUID;

public class GameConcurrentModificationException extends RuntimeException {
    public GameConcurrentModificationException(UUID gameId) {
        super("Game state changed concurrently for game: " + gameId);
    }
}