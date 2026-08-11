package com.chessy.chess_backend.controller.socketio.challenge;

import java.io.Serializable;
import java.util.UUID;

public class ChallengeEndedMessage implements Serializable {
    private UUID challengeId;
    private UUID challengerId;
    private UUID challengedId;
    private String reason;

    public ChallengeEndedMessage() {
    }

    public ChallengeEndedMessage(UUID challengeId, UUID challengerId, UUID challengedId, String reason) {
        this.challengeId = challengeId;
        this.challengerId = challengerId;
        this.challengedId = challengedId;
        this.reason = reason;
    }

    public UUID getChallengeId() {
        return challengeId;
    }

    public UUID getChallengerId() {
        return challengerId;
    }

    public UUID getChallengedId() {
        return challengedId;
    }

    public String getReason() {
        return reason;
    }
}