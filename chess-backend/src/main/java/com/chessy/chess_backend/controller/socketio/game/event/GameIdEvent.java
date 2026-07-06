package com.chessy.chess_backend.controller.socketio.game.event;

public class GameIdEvent {
    private String gameId;

    public GameIdEvent(String gameId) {
        this.gameId = gameId;
    }

    public String getGameId() { return gameId; }
}
