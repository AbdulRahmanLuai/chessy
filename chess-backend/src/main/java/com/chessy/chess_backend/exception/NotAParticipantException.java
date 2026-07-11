package com.chessy.chess_backend.exception;

public class NotAParticipantException extends RuntimeException {
    public NotAParticipantException() {
        super("You are not a player in this game");
    }
}