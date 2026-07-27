package com.chessy.chess_backend.controller.rest;

import com.chessy.chess_backend.dto.computerGame.ComputerGameDto;
import com.chessy.chess_backend.dto.onlineGame.GameDto;
import com.chessy.chess_backend.dto.gameGeneral.MoveListDto;
import com.chessy.chess_backend.security.CustomUserDetails;
import com.chessy.chess_backend.service.GameService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/games")
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;

    @GetMapping("/active")
    public ResponseEntity<GameDto> getActiveGame(Authentication auth) {
        UUID userId = currentUserId(auth);
        System.out.println("fetching active game for user: " + userId);
        return gameService.getActiveGame(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(null));
    }

    @GetMapping("/{gameId}")
    public ResponseEntity<GameDto> getGame(@PathVariable UUID gameId) {
        return ResponseEntity.ok(gameService.getGame(gameId));
    }

    @GetMapping("/{gameId}/moves")
    public ResponseEntity<MoveListDto> getMoves(@PathVariable UUID gameId) {
        return ResponseEntity.ok(gameService.getMoves(gameId));
    }

    @GetMapping
    public ResponseEntity<Page<GameDto>> getUserGames(
            @RequestParam String userName,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {


        System.out.println("pp, userName: " + userName);
        Page<GameDto> games = gameService.getUserGames(userName, pageable);
        return ResponseEntity.ok(games);
    }

    private UUID currentUserId(Authentication auth) {
        return ((CustomUserDetails) auth.getPrincipal()).getId();
    }
}