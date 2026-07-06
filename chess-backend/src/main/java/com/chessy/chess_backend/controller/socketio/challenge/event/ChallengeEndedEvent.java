package com.chessy.chess_backend.controller.socketio.challenge.event;

public class ChallengeEndedEvent {
    private String challengeId;
    private String reason; // "declined" | "cancelled" | "overridden" | "expired"

    public ChallengeEndedEvent(String challengeId, String reason) {
        this.challengeId = challengeId;
        this.reason = reason;
    }

    public String getChallengeId() { return challengeId; }
    public String getReason() { return reason; }
}