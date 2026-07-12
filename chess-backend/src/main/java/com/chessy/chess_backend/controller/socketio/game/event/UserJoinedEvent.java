package com.chessy.chess_backend.controller.socketio.game.event;

public class UserJoinedEvent {
    private String gameId;
    private String userId;

    public UserJoinedEvent(String gameId, String userId) {
        this.gameId = gameId;
        this.userId = userId;
    }

    public String getGameId() { return gameId; }
    public String getUserId() { return userId; }
}