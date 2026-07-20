package com.chessy.chess_backend.controller.socketio.computerGame.event;

public class ComputerGameEndedEvent {
    private final String gameId;
    private final String result;
    private final String winner;
    private final String resultReason;

    public ComputerGameEndedEvent(String gameId, String result, String winner, String resultReason) {
        this.gameId = gameId;
        this.result = result;
        this.winner = winner;
        this.resultReason = resultReason;
    }

    public String getGameId() { return gameId; }
    public String getResult() { return result; }
    public String getWinner() { return winner; }
    public String getResultReason() { return resultReason; }
}