package com.chessy.chess_backend.controller.socketio.computerGame.event;

/**
 * Mirrors MoveAppliedEvent. Broadcast to the client right after a move is
 * persisted — used for both the user's move and, separately, the bot's
 * reply move (same event shape, published from wherever each move gets
 * applied).
 */
public record ComputerMoveAppliedEvent(
        String gameId,
        MoveDetail move,
        String currentFen,
        Long whiteTimeRemainingMs,
        Long blackTimeRemainingMs
) {
    public record MoveDetail(String from, String to, String promotion, String san) {
    }
}