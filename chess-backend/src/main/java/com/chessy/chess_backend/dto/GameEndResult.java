package com.chessy.chess_backend.dto;

import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GameEndResult {
    private UUID gameId;
    private String result;
    private GameResultReason resultReason;
    private UUID winner;
    private Instant finishedAt;
}