package com.chessy.chess_backend.controller.socketio.computerGame;

import com.chessy.chess_backend.controller.socketio.computerGame.payload.ComputerGameMovePayload;
import com.chessy.chess_backend.dto.gameGeneral.MoveDto;
import com.chessy.chess_backend.model.Move;
import com.chessy.chess_backend.model.enums.computerGame.Difficulty;
import com.chessy.chess_backend.model.enums.computerGame.EngineType;

import java.util.List;

public interface ChessEngine {

    EngineType getType();


    ComputerGameMovePayload computeMove(String fen, List<MoveDto> moveHistory, Difficulty difficulty);
}