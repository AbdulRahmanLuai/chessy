package com.chessy.chess_backend.service;

import com.chessy.chess_backend.dto.*;
import com.chessy.chess_backend.entity.Game;
import com.chessy.chess_backend.mapper.GameMapper;
import com.chessy.chess_backend.mapper.MoveMapper;
import com.chessy.chess_backend.repository.GameRepository;
import com.chessy.chess_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GameService {

    private final GameRepository gameRepository;
    private final GameMapper gameMapper;
    private final MoveMapper moveMapper;
    private final UserRepository userRepository;


    public CreateGameResponseDto createGame(UUID whitePlayerId, UUID blackPlayerId) {
        Game game = Game.builder()
                .whitePlayer(userRepository.getById(whitePlayerId))
                .blackPlayer(userRepository.getById(blackPlayerId))
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

    public Boolean hasActiveGame(UUID userId){
        return gameRepository.hasActiveGame(userId);
    }

    @Transactional
    public GameDto startGame(UUID gameId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow();

        game.setStatus(Game.GameStatus.IN_PROGRESS);
        gameRepository.save(game);

        return gameMapper.toDto(game);
    }
}