package com.chessy.chess_backend.controller.socketio.challenge.event;

public class ChallengeSentEvent {
    private String challengeId;
    private String challengedUserId;
    private String preferredColor;
    private long expiresAtEpochMs;

    public ChallengeSentEvent(String challengeId, String challengedUserId, String preferredColor, long expiresAtEpochMs) {
        this.challengeId = challengeId;
        this.challengedUserId = challengedUserId;
        this.preferredColor = preferredColor;
        this.expiresAtEpochMs = expiresAtEpochMs;
    }

    public String getChallengeId() { return challengeId; }
    public String getChallengedUserId() { return challengedUserId; }
    public String getPreferredColor() { return preferredColor; }
    public long getExpiresAtEpochMs() { return expiresAtEpochMs; }
}