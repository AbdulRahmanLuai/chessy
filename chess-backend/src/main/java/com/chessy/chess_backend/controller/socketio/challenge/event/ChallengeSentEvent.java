 package com.chessy.chess_backend.controller.socketio.challenge.event;

public class ChallengeSentEvent {
    private String challengeId;
    private String challengedUserId;
    private String preferredColor;
    private long expiresAtEpochMs;
    private String toUsername;
    private String toDisplayName; // display name of challenged

    public ChallengeSentEvent(String challengeId, String challengedUserId, String preferredColor, long expiresAtEpochMs, String toUsername, String toDisplayName) {
        this.challengeId = challengeId;
        this.challengedUserId = challengedUserId;
        this.preferredColor = preferredColor;
        this.expiresAtEpochMs = expiresAtEpochMs;
        this.toUsername = toUsername;
        this.toDisplayName = toDisplayName;
    }

    public String getChallengeId() { return challengeId; }
    public String getChallengedUserId() { return challengedUserId; }
    public String getPreferredColor() { return preferredColor; }
    public long getExpiresAtEpochMs() { return expiresAtEpochMs; }
    public String getToUsername(){return toUsername;};
    public String getToDisplayName() {return toDisplayName;}
}