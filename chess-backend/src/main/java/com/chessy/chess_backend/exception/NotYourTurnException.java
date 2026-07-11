package com.chessy.chess_backend.exception;

public class NotYourTurnException extends RuntimeException {
    public NotYourTurnException() {
        super("Not your turn");
    }
}