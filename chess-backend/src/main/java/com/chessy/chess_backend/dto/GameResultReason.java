package com.chessy.chess_backend.dto;

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