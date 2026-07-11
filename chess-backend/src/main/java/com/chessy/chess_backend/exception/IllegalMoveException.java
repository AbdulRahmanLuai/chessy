package com.chessy.chess_backend.exception;

public class IllegalMoveException extends RuntimeException {
    public IllegalMoveException() {
        super("Illegal move");
    }
}