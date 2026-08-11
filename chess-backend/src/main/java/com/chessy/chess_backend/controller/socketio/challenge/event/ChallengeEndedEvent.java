package com.chessy.chess_backend.controller.socketio.challenge.event;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ChallengeEndedEvent {
    private String challengeId;
    private String reason; // "declined" | "cancelled" | "overridden" | "expired"
}