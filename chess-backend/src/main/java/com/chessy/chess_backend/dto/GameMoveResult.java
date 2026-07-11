package com.chessy.chess_backend.dto;

import com.chessy.chess_backend.controller.socketio.game.event.MoveAppliedEvent;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GameMoveResult {
    private GameDto game;
    private MoveAppliedEvent moveEvent;
    private GameEndResult endResult; // null if game continues
}