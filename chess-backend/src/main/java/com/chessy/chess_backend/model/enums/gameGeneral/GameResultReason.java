package com.chessy.chess_backend.model.enums.gameGeneral;

public enum GameResultReason {
    CHECKMATE,
    STALEMATE,
    THREEFOLD_REPETITION,
    INSUFFICIENT_MATERIAL,
    FIFTY_MOVE_RULE,
    TIMEOUT,
    RESIGNATION,
    DRAW_AGREEMENT,
    ABORTED
}