package com.chessy.chess_backend.exception;

public class MoveNotationException extends RuntimeException {
    public MoveNotationException(Throwable cause) {
        super("Failed to generate move notation", cause);
    }
}