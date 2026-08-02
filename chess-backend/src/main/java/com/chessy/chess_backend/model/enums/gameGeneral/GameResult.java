package com.chessy.chess_backend.model.enums.gameGeneral;

/**
 * Canonical set of values allowed in {@code Game.result}. This is deliberately
 * decoupled from {@link GameResultReason}: GameResult captures the chess
 * *outcome* (who won, or that it was a draw), while GameResultReason captures
 * *why* the game ended (checkmate, resignation, timeout, etc).
 * <p>
 * Aborted games have no chess outcome, so they should NOT use this enum —
 * {@code Game.result} is left {@code null} for aborted games, with
 * {@code resultReason = ABORTED} and {@code status = ABORTED} fully
 * describing that state instead.
 */
public enum GameResult {
    WHITE_WINS("1-0"),
    BLACK_WINS("0-1"),
    DRAW("1/2-1/2");

    private final String pgnValue;

    GameResult(String pgnValue) {
        this.pgnValue = pgnValue;
    }

    /**
     * The canonical string persisted to {@code Game.result}. Named
     * explicitly (rather than overriding {@link #toString()}) so call
     * sites are unambiguous about what they're getting.
     */
    public String pgnValue() {
        return pgnValue;
    }

    @Override
    public String toString() {
        return pgnValue;
    }
}