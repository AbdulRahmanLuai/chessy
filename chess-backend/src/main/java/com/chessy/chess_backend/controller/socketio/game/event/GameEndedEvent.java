package com.chessy.chess_backend.controller.socketio.game.event;

import java.util.UUID;

public class GameEndedEvent {
    private String gameId;
    private String result;
    private String reason;
    private String winner;
    private String finishedAt;
    private Long whiteTimeRemainingMs;
    private Long blackTimeRemainingMs;
    // TODO: add time remaining and configure frontend to show correct time on game end.

    public GameEndedEvent() {
    }

    public GameEndedEvent(String gameId, String result, String winner,  String reason, String finishedAt,
                          Long whiteTimeRemainingMs, Long blackTimeRemainingMs) {
        this.gameId = gameId;
        this.result = result;
        this.reason = reason;
        this.winner = winner;
        this.finishedAt = finishedAt;
        this.whiteTimeRemainingMs = whiteTimeRemainingMs;
        this.blackTimeRemainingMs = blackTimeRemainingMs;
    }

    public String getFinishedAt() {return finishedAt;}
    public String getGameId() { return gameId; }
    public String getResult() { return result; }
    public String getReason() { return reason; }
    public String getWinner() {return winner; }
    public Long getWhiteTimeRemainingMs() {return whiteTimeRemainingMs;}
    public Long getBlackTimeRemainingMs() {return blackTimeRemainingMs;}
}
