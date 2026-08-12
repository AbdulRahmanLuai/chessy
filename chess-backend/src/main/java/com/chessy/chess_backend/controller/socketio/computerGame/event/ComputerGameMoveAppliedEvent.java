package com.chessy.chess_backend.controller.socketio.computerGame.event;

import java.time.Instant;

public class ComputerGameMoveAppliedEvent {
    private String gameId;
    private MoveDetail move;
    private String fen;
    private Long whiteTimeRemainingMs;
    private Long blackTimeRemainingMs;
    private String movedAt;

    public ComputerGameMoveAppliedEvent() {
    }

    public ComputerGameMoveAppliedEvent(String gameId, MoveDetail move, String fen,
                                         Long whiteTimeRemainingMs, Long blackTimeRemainingMs, String movedAt) {
        this.gameId = gameId;
        this.move = move;
        this.fen = fen;
        this.whiteTimeRemainingMs = whiteTimeRemainingMs;
        this.blackTimeRemainingMs = blackTimeRemainingMs;
        this.movedAt = movedAt;
    }

    public String getGameId() {
        return gameId;
    }

    public MoveDetail getMove() {
        return move;
    }

    public String getFen() {
        return fen;
    }

    public Long getWhiteTimeRemainingMs() {
        return whiteTimeRemainingMs;
    }

    public Long getBlackTimeRemainingMs() {
        return blackTimeRemainingMs;
    }
    // TODO: used lombok for auto getters/setters everywhere.
    public String getMovedAt() {return movedAt;}

    public static class MoveDetail {
        private String from;
        private String to;
        private String promotion;
        private String san;

        public MoveDetail() {
        }

        public MoveDetail(String from, String to, String promotion, String san) {
            this.from = from;
            this.to = to;
            this.promotion = promotion;
            this.san = san;
        }

        public String getFrom() {
            return from;
        }

        public String getTo() {
            return to;
        }

        public String getPromotion() {
            return promotion;
        }

        public String getSan() {
            return san;
        }
    }
}
