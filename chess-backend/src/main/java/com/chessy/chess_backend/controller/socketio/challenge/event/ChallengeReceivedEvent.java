package com.chessy.chess_backend.controller.socketio.challenge.event;

public class ChallengeReceivedEvent {
    private String challengeId;
    private String fromUserId;
    private String fromUsername;
    private String fromDisplayName;
    private String preferredColor; // from the receiver's perspective — see note below
    private long expiresAtEpochMs;

    public ChallengeReceivedEvent(String challengeId, String fromUserId, String fromUsername,
                                  String fromDisplayName, String preferredColor, long expiresAtEpochMs) {
        this.challengeId = challengeId;
        this.fromUserId = fromUserId;
        this.fromUsername = fromUsername;
        this.fromDisplayName = fromDisplayName;
        this.preferredColor = preferredColor;
        this.expiresAtEpochMs = expiresAtEpochMs;
    }

    public String getChallengeId() { return challengeId; }
    public String getFromUserId() { return fromUserId; }
    public String getFromUsername() { return fromUsername; }
    public String getFromDisplayName() { return fromDisplayName; }
    public String getPreferredColor() { return preferredColor; }
    public long getExpiresAtEpochMs() { return expiresAtEpochMs; }
}