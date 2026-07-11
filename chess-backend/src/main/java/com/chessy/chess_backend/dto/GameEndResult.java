package com.chessy.chess_backend.dto;

import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GameEndResult {
    private UUID gameId;
    private String result;       // "checkmate", "draw", etc.
    private String resultReason; // "checkmate", "stalemate", "threefold_repetition", ...
    private UUID winner;         // null for draws
    private Instant finishedAt;
}