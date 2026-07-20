package com.chessy.chess_backend.controller.socketio.computerGame.payload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ComputerGameMovePayload {

    private String gameId;
    private String from;      // Square, e.g. "e2"
    private String to;        // Square, e.g. "e4"
    private String promotion; // PieceSymbol, nullable
}