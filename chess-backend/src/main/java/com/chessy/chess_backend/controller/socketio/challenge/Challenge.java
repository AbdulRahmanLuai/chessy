package com.chessy.chess_backend.controller.socketio.challenge;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Getter
@NoArgsConstructor
public class Challenge implements Serializable {
    private UUID id;
    private UUID challengerId;
    private UUID challengedId;
    private String preferredColor;
    private int timeLimitSeconds;
    private int incrementSeconds;
    private Instant createdAt;
    private Instant expiresAt;

    public Challenge(UUID challengerId, UUID challengedId, String preferredColor, Integer timeLimitSeconds, Integer incrementSeconds, long ttlSeconds) {
        this.id = UUID.randomUUID();
        this.challengerId = challengerId;
        this.challengedId = challengedId;
        this.preferredColor = preferredColor != null ? preferredColor : "RANDOM";
        this.timeLimitSeconds = timeLimitSeconds;
        this.incrementSeconds = incrementSeconds != null ? incrementSeconds : 0;
        this.createdAt = Instant.now();
        this.expiresAt = this.createdAt.plusSeconds(ttlSeconds);
    }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }
}