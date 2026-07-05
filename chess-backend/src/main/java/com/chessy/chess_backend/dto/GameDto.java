package com.chessy.chess_backend.dto;

import com.chessy.chess_backend.entity.Game;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameDto {

    private UUID id;

    private PlayerDto whitePlayer;
    private PlayerDto blackPlayer;

    private Game.GameStatus status;

    private String currentFen;

    private List<MoveDto> moves;

    private String result;
    private String resultReason;

    private Integer timeInitialSeconds;
    private Integer timeIncrementSeconds;

    private Long whiteTimeRemainingMs;
    private Long blackTimeRemainingMs;

    private Instant lastMoveAt;
    private Instant currentPlayerDeadlineAt;

    private Instant createdAt;
    private Instant finishedAt;
}