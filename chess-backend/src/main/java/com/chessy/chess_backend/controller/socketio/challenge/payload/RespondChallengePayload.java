package com.chessy.chess_backend.controller.socketio.challenge.payload;

public class RespondChallengePayload {
    private String challengeId;

    public String getChallengeId() { return challengeId; }
    public void setChallengeId(String challengeId) { this.challengeId = challengeId; }
}