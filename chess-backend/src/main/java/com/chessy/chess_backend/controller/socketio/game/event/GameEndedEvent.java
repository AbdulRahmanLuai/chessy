package com.chessy.chess_backend.controller.socketio.game.event;

import java.util.UUID;

public class GameEndedEvent {
    private String gameId;
    private String result;
    private String reason;
    private String winner;

    public GameEndedEvent(String gameId, String result, String winner,  String reason) {
        this.gameId = gameId;
        this.result = result;
        this.reason = reason;
        this.winner = winner;
    }

    public String getGameId() { return gameId; }
    public String getResult() { return result; }
    public String getReason() { return reason; }
    public String getWinner() {return winner; }
}
