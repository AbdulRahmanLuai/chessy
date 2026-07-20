package com.chessy.chess_backend.dto.computerGame;

import com.chessy.chess_backend.controller.socketio.computerGame.event.ComputerGameMoveAppliedEvent;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComputerGameMoveResult {
    private ComputerGameDto game;
    private ComputerGameMoveAppliedEvent moveEvent;
    private ComputerGameEndResult endResult; // null if game continues
}
