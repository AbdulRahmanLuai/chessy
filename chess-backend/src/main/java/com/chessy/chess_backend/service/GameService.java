package com.chessy.chess_backend.service;

import com.chessy.chess_backend.dto.*;
import com.chessy.chess_backend.entity.Game;
import com.chessy.chess_backend.mapper.GameMapper;
import com.chessy.chess_backend.mapper.MoveMapper;
import com.chessy.chess_backend.repository.GameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GameService {

    private final GameRepository gameRepository;
    private final GameMapper gameMapper;
    private final MoveMapper moveMapper;

    public CreateGameResponseDto createGame() {
        Game game = Game.builder()
                .whitePlayer(null)
                .blackPlayer(null)
                .status(Game.GameStatus.WAITING)
                .currentFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
                .moves(new ArrayList<>())
                .timeInitialSeconds(600)
                .timeIncrementSeconds(0)
                .whiteTimeRemainingMs(600_000L)
                .blackTimeRemainingMs(600_000L)
                .build();

        Game saved = gameRepository.save(game);

        return CreateGameResponseDto.builder()
                .gameId(saved.getId())
                .build();
    }

    public GameDto getGame(UUID gameId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        return gameMapper.toDto(game);
    }

    public MoveListDto getMoves(UUID gameId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        return MoveListDto.builder()
                .gameId(game.getId())
                .moves(game.getMoves().stream()
                        .map(moveMapper::toDto)
                        .toList())
                .build();
    }
}