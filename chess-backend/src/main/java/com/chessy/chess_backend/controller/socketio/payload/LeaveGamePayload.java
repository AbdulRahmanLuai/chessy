package com.chessy.chess_backend.controller.socketio.payload;

public class LeaveGamePayload {
    private String gameId;

    public String getGameId() { return gameId; }
    public void setGameId(String gameId) { this.gameId = gameId; }
}
