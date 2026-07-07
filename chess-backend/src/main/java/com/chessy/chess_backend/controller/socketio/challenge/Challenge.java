package com.chessy.chess_backend.controller.socketio.challenge;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ScheduledFuture;

public class Challenge {
    private final UUID id;
    private final UUID challengerId;
    private final UUID challengedId;
    private final String preferredColor; // "WHITE" | "BLACK" | "RANDOM"
    private final Instant createdAt;
    private final Instant expiresAt;
    private ScheduledFuture<?> expiryTask;

    public Challenge(UUID challengerId, UUID challengedId, String preferredColor, long ttlSeconds) {
        this.id = UUID.randomUUID();
        this.challengerId = challengerId;
        this.challengedId = challengedId;
        this.preferredColor = preferredColor != null ? preferredColor : "RANDOM";
        this.createdAt = Instant.now();
        this.expiresAt = this.createdAt.plusSeconds(ttlSeconds);
    }

    public UUID getId() { return id; }
    public UUID getChallengerId() { return challengerId; }
    public UUID getChallengedId() { return challengedId; }
    public String getPreferredColor() { return preferredColor; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getExpiresAt() { return expiresAt; }

    public void setExpiryTask(ScheduledFuture<?> task) { this.expiryTask = task; }
    public void cancelExpiryTask() {
        if (expiryTask != null) expiryTask.cancel(false);
    }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }
}