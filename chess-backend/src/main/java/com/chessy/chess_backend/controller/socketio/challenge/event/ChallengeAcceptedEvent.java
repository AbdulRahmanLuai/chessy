package com.chessy.chess_backend.controller.socketio.challenge.event;

public class ChallengeAcceptedEvent {
    private String challengeId;
    private String gameId;

    public ChallengeAcceptedEvent(String challengeId, String gameId) {
        this.challengeId = challengeId;
        this.gameId = gameId;
    }

    public String getChallengeId() { return challengeId; }
    public String getGameId() { return gameId; }
}