package com.chessy.chess_backend.controller.socketio.event;

public class GameEndedEvent {
    private String gameId;
    private String result;
    private String reason;

    public GameEndedEvent(String gameId, String result, String reason) {
        this.gameId = gameId;
        this.result = result;
        this.reason = reason;
    }

    public String getGameId() { return gameId; }
    public String getResult() { return result; }
    public String getReason() { return reason; }
}
