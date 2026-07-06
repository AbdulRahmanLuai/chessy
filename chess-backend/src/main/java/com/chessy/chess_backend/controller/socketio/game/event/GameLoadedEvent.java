package com.chessy.chess_backend.controller.socketio.game.event;

public class GameLoadedEvent {
    private String fen;
    private long whiteTimeRemainingMs;
    private long blackTimeRemainingMs;

    public GameLoadedEvent(String fen, long whiteTimeRemainingMs, long blackTimeRemainingMs) {
        this.fen = fen;
        this.whiteTimeRemainingMs = whiteTimeRemainingMs;
        this.blackTimeRemainingMs = blackTimeRemainingMs;
    }

    public String getFen() { return fen; }
    public long getWhiteTimeRemainingMs() { return whiteTimeRemainingMs; }
    public long getBlackTimeRemainingMs() { return blackTimeRemainingMs; }
}
