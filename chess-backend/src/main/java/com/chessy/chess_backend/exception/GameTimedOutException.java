package com.chessy.chess_backend.exception;

import com.chessy.chess_backend.dto.GameEndResult;

public class GameTimedOutException extends RuntimeException {

    private final GameEndResult endResult;

    public GameTimedOutException(GameEndResult endResult) {
        super("Game has timed out");
        this.endResult = endResult;
    }

    public GameEndResult getEndResult() {
        return endResult;
    }
}