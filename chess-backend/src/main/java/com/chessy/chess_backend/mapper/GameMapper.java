package com.chessy.chess_backend.mapper;

import com.chessy.chess_backend.dto.GameDto;
import com.chessy.chess_backend.model.Move;
import com.chessy.chess_backend.entity.Game;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class GameMapper {

    private final MoveMapper moveMapper;

    public GameDto toDto(Game game) {
        return GameDto.builder()
                .id(game.getId())
                .whitePlayer(null) // fill later when PlayerDto exists
                .blackPlayer(null)
                .status(game.getStatus())
                .currentFen(game.getCurrentFen())
                .moves(mapMoves(game.getMoves()))
                .result(game.getResult())
                .resultReason(game.getResultReason())
                .timeInitialSeconds(game.getTimeInitialSeconds())
                .timeIncrementSeconds(game.getTimeIncrementSeconds())
                .whiteTimeRemainingMs(game.getWhiteTimeRemainingMs())
                .blackTimeRemainingMs(game.getBlackTimeRemainingMs())
                .lastMoveAt(game.getLastMoveAt())
                .currentPlayerDeadlineAt(game.getCurrentPlayerDeadlineAt())
                .createdAt(game.getCreatedAt())
                .finishedAt(game.getFinishedAt())
                .build();
    }

    private List<com.chessy.chess_backend.dto.MoveDto> mapMoves(List<Move> moves) {
        if (moves == null) return List.of();

        return moves.stream()
                .map(moveMapper::toDto)
                .toList();
    }
}