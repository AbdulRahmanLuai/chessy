package com.chessy.chess_backend.dto.computerGame;

import com.chessy.chess_backend.dto.gameGeneral.MoveDto;
import com.chessy.chess_backend.entity.ComputerGame;
import com.chessy.chess_backend.model.enums.computerGame.Difficulty;
import com.chessy.chess_backend.model.enums.computerGame.UserColor;
import com.chessy.chess_backend.model.enums.gameGeneral.GameStatus;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComputerGameDto {
    private UUID id;
    private UUID userId;
    private UserColor userColor;
    private GameStatus status;
    private String currentFen;
    private List<MoveDto> moves;
    private Difficulty difficulty;
    private String engine;
    private String result;
    private String resultReason;
    private boolean isTimed;
    private Integer timeInitialSeconds;
    private Integer timeIncrementSeconds;
    private Long whiteTimeRemainingMs;
    private Long blackTimeRemainingMs;
    private Instant lastMoveAt;
    private Instant currentPlayerDeadlineAt;
    private Instant createdAt;
    private Instant finishedAt;


}
