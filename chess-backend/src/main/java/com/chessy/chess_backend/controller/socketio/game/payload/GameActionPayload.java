package com.chessy.chess_backend.controller.socketio.game.payload;

public class GameActionPayload {
    private String gameId;

    public String getGameId() { return gameId; }
    public void setGameId(String gameId) { this.gameId = gameId; }
}
