package com.chessy.chess_backend.controller.socketio.challenge.event;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ChallengeSentEvent {
    private String challengeId;
    private String challengedUserId;
    private String preferredColor;
    private long expiresAtEpochMs;
    private String toUsername;
    private String toDisplayName; // display name of challenged
}