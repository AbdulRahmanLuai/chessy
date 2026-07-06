package com.chessy.chess_backend.controller.socketio.challenge.payload;

public class SendChallengePayload {
    private String challengedUserId;

    public String getChallengedUserId() { return challengedUserId; }
    public void setChallengedUserId(String challengedUserId) { this.challengedUserId = challengedUserId; }
}