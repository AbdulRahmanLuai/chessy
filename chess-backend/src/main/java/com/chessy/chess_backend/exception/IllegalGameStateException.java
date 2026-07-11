package com.chessy.chess_backend.exception;


public class IllegalGameStateException extends RuntimeException {
    public IllegalGameStateException(String message) {
        super(message);
    }
}