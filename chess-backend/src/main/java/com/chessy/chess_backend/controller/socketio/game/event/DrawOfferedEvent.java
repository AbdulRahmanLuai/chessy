package com.chessy.chess_backend.controller.socketio.game.event;

public class DrawOfferedEvent {
    private String byUserId;

    public DrawOfferedEvent(String byUserId) {
        this.byUserId = byUserId;
    }

    public String getByUserId() { return byUserId; }
}
