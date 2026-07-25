package com.chessy.chess_backend.controller.socketio.computerGame.event;

public class ComputerGameEndedEvent {
    private final String gameId;
    private final String result;
    private final String winner;
    private final String resultReason;
    private final String finishedAt;
    private Long whiteTimeRemainingMs;
    private Long blackTimeRemainingMs;

    public ComputerGameEndedEvent(String gameId, String result, String winner, String resultReason, String finishedAt, Long whiteTimeRemainingMs, Long blackTimeRemainingMs) {
        this.gameId = gameId;
        this.result = result;
        this.winner = winner;
        this.resultReason = resultReason;
        this.finishedAt = finishedAt;
        this.whiteTimeRemainingMs = whiteTimeRemainingMs;
        this.blackTimeRemainingMs = blackTimeRemainingMs;
    }

    public Long getWhiteTimeRemainingMs() {return whiteTimeRemainingMs;}
    public Long getBlackTimeRemainingMs() {return blackTimeRemainingMs;}

    public String getFinishedAt() {return finishedAt;}
    public String getGameId() { return gameId; }
    public String getResult() { return result; }
    public String getWinner() { return winner; }
    public String getResultReason() { return resultReason; }
}