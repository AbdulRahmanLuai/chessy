package com.chessy.chess_backend.event.computerGame;

import java.util.UUID;

public record ComputerGameFinishedEvent(UUID gameId) {
}