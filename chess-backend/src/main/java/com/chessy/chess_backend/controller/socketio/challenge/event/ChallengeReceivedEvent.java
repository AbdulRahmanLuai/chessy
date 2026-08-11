package com.chessy.chess_backend.controller.socketio.challenge.event;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ChallengeReceivedEvent {
    private String challengeId;
    private String fromUserId;
    private String fromUsername;
    private String fromDisplayName;
    private String preferredColor; // from the receiver's perspective
    private long expiresAtEpochMs;
}