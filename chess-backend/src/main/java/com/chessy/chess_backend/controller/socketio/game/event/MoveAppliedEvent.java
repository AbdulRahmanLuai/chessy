package com.chessy.chess_backend.controller.socketio.game.event;

public class MoveAppliedEvent {
    private String gameId;
    private MoveDetail move;
    private String fen;
    private long whiteTimeRemainingMs;
    private long blackTimeRemainingMs;

    public MoveAppliedEvent(String gameId, MoveDetail move, String fen,
                             long whiteTimeRemainingMs, long blackTimeRemainingMs) {
        this.gameId = gameId;
        this.move = move;
        this.fen = fen;
        this.whiteTimeRemainingMs = whiteTimeRemainingMs;
        this.blackTimeRemainingMs = blackTimeRemainingMs;
    }

    public String getGameId() { return gameId; }
    public MoveDetail getMove() { return move; }
    public String getFen() { return fen; }
    public long getWhiteTimeRemainingMs() { return whiteTimeRemainingMs; }
    public long getBlackTimeRemainingMs() { return blackTimeRemainingMs; }

    public static class MoveDetail {
        private String from;
        private String to;
        private String promotion;

        public MoveDetail(String from, String to, String promotion) {
            this.from = from;
            this.to = to;
            this.promotion = promotion;
        }

        public String getFrom() { return from; }
        public String getTo() { return to; }
        public String getPromotion() { return promotion; }
    }
}
