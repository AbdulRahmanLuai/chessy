package com.chessy.chess_backend.controller.socketio.game.payload;

public class MovePayload {
    private String gameId;
    private String from;      // Square, e.g. "e2"
    private String to;        // Square, e.g. "e4"
    private String promotion; // PieceSymbol, nullable

    public String getGameId() { return gameId; }
    public void setGameId(String gameId) { this.gameId = gameId; }
    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }
    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }
    public String getPromotion() { return promotion; }
    public void setPromotion(String promotion) { this.promotion = promotion; }
}
