package com.chessy.chess_backend.controller.socketio.computerGame.payload;

public class ComputerGameActionPayload {
    private String gameId;

    public String getGameId() { return gameId; }
    public void setGameId(String gameId) { this.gameId = gameId; }
}