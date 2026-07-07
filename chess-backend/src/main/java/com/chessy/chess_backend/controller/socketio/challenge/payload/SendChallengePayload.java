package com.chessy.chess_backend.controller.socketio.challenge.payload;

public class SendChallengePayload {
    private String challengedUserId;
    private String preferredColor; // "WHITE" | "BLACK" | "RANDOM", nullable → treat null as RANDOM

    public String getChallengedUserId() { return challengedUserId; }
    public void setChallengedUserId(String challengedUserId) { this.challengedUserId = challengedUserId; }
    public String getPreferredColor() { return preferredColor; }
    public void setPreferredColor(String preferredColor) { this.preferredColor = preferredColor; }
}