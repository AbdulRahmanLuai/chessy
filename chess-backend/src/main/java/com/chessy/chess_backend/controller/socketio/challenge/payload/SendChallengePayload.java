package com.chessy.chess_backend.controller.socketio.challenge.payload;

public class SendChallengePayload {
    private String challengedUserId;
    private String preferredColor; // "WHITE" | "BLACK" | "RANDOM", nullable → treat null as RANDOM
    private Integer timeLimitSeconds;
    private Integer incrementSeconds;

    public String getChallengedUserId() { return challengedUserId; }
    public void setChallengedUserId(String challengedUserId) { this.challengedUserId = challengedUserId; }

    public String getPreferredColor() { return preferredColor; }
    public void setPreferredColor(String preferredColor) { this.preferredColor = preferredColor; }

    public Integer getTimeLimitSeconds() { return timeLimitSeconds; }
    public void setTimeLimitSeconds(Integer timeLimitSeconds) { this.timeLimitSeconds = timeLimitSeconds; }

    public Integer getIncrementSeconds() { return incrementSeconds; }
    public void setIncrementSeconds(Integer incrementSeconds) { this.incrementSeconds = incrementSeconds; }
}