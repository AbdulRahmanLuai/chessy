package com.chessy.chess_backend.dto.computerGame;

import com.chessy.chess_backend.model.enums.computerGame.Difficulty;

public record CreateComputerGameRequest(
        Difficulty difficulty,
        String engine,
        boolean isTimed,
        Integer timeInitialSeconds,
        Integer timeIncrementSeconds,
        String colorPreference
) {
}
