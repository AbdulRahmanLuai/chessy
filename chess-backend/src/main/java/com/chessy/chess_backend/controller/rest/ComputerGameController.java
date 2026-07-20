package com.chessy.chess_backend.controller.rest;

import com.chessy.chess_backend.dto.computerGame.CreateComputerGameRequest;
import com.chessy.chess_backend.dto.computerGame.ComputerGameDto;
import com.chessy.chess_backend.security.CustomUserDetails;
import com.chessy.chess_backend.service.ComputerGameService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/computer-games")
@RequiredArgsConstructor
public class ComputerGameController {

    private final ComputerGameService computerGameService;

    @GetMapping("/active")
    public ResponseEntity<ComputerGameDto> getActiveGame(Authentication auth) {
        UUID userId = currentUserId(auth);
        return computerGameService.getActiveGame(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(null));
    }

    @PostMapping
    public ResponseEntity<ComputerGameDto> createGame(Authentication auth,
                                                      @RequestBody CreateComputerGameRequest request) {
        UUID userId = currentUserId(auth);
        ComputerGameDto game = computerGameService.createOrGetGame(
                userId,
                request.difficulty(),
                request.engine(),
                request.isTimed(),
                request.timeInitialSeconds(),
                request.timeIncrementSeconds(),
                request.colorPreference()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(game);
    }

    @GetMapping("/{gameId}")
    public ResponseEntity<ComputerGameDto> getGame(Authentication auth, @PathVariable UUID gameId) {
        UUID userId = currentUserId(auth);
        return ResponseEntity.ok(computerGameService.getGameForUser(gameId, userId));
    }

    private UUID currentUserId(Authentication auth) {
        return ((CustomUserDetails) auth.getPrincipal()).getId();
    }
}