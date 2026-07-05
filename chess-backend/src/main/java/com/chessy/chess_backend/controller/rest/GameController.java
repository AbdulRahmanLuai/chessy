package com.chessy.chess_backend.controller.rest;

import com.chessy.chess_backend.dto.CreateGameResponseDto;
import com.chessy.chess_backend.dto.GameDto;
import com.chessy.chess_backend.dto.MoveListDto;
import com.chessy.chess_backend.service.GameService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/games")
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;

    @GetMapping("/{gameId}")
    public ResponseEntity<GameDto> getGame(@PathVariable UUID gameId) {
        return ResponseEntity.ok(gameService.getGame(gameId));
    }

    @PostMapping
    public ResponseEntity<CreateGameResponseDto> createGame() {
        return ResponseEntity.ok(gameService.createGame());
    }

    @GetMapping("/{gameId}/moves")
    public ResponseEntity<MoveListDto> getMoves(@PathVariable UUID gameId) {
        return ResponseEntity.ok(gameService.getMoves(gameId));
    }
}