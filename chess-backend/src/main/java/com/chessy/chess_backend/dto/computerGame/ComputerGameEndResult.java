package com.chessy.chess_backend.dto.computerGame;

import com.chessy.chess_backend.model.enums.computerGame.ComputerGameWinner;
import com.chessy.chess_backend.model.enums.gameGeneral.GameResultReason;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComputerGameEndResult {
    private UUID gameId;
    private String result;
    private GameResultReason resultReason;
    private ComputerGameWinner winner;
    private Instant finishedAt;
    private UUID userId;
}