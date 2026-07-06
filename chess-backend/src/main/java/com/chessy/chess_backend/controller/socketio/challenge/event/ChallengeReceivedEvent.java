package com.chessy.chess_backend.controller.socketio.challenge.event;

public class ChallengeReceivedEvent {
    private String challengeId;
    private String fromUserId;
    private long expiresAtEpochMs;

    public ChallengeReceivedEvent(String challengeId, String fromUserId, long expiresAtEpochMs) {
        this.challengeId = challengeId;
        this.fromUserId = fromUserId;
        this.expiresAtEpochMs = expiresAtEpochMs;
    }

    public String getChallengeId() { return challengeId; }
    public String getFromUserId() { return fromUserId; }
    public long getExpiresAtEpochMs() { return expiresAtEpochMs; }
}