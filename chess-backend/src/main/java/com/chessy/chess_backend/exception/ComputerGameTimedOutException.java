package com.chessy.chess_backend.exception;

import com.chessy.chess_backend.dto.computerGame.ComputerGameEndResult;
import lombok.Getter;

@Getter
public class ComputerGameTimedOutException extends RuntimeException {
    private final ComputerGameEndResult endResult;

    public ComputerGameTimedOutException(ComputerGameEndResult endResult) {
        super("Computer game timed out");
        this.endResult = endResult;
    }
}