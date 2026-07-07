package com.chessy.chess_backend.controller.socketio.challenge;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.BiConsumer;

@Service
public class ChallengeService {

    private static final long TTL_SECONDS = 30;

    private final Map<UUID, Challenge> byChallenger = new ConcurrentHashMap<>();
    private final Map<UUID, Challenge> byId = new ConcurrentHashMap<>();
    private final Map<UUID, ConcurrentHashMap.KeySetView<UUID, Boolean>> byChallenged = new ConcurrentHashMap<>();

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

    public Challenge create(UUID challengerId, UUID challengedId, String preferredColor,
                            BiConsumer<Challenge, String> onOverrideOrCancel,
                            BiConsumer<Challenge, String> onExpire) {

        Challenge existing = byChallenger.get(challengerId);
        if (existing != null) {
            removeInternal(existing);
            onOverrideOrCancel.accept(existing, "overridden");
        }

        Challenge challenge = new Challenge(challengerId, challengedId, preferredColor, TTL_SECONDS);

        var expiryTask = scheduler.schedule(() -> {
            Challenge stillActive = removeIfPresent(challenge.getId());
            if (stillActive != null) {
                onExpire.accept(stillActive, "expired");
            }
        }, TTL_SECONDS, TimeUnit.SECONDS);

        challenge.setExpiryTask(expiryTask);

        byChallenger.put(challengerId, challenge);
        byId.put(challenge.getId(), challenge);
        byChallenged.computeIfAbsent(challengedId, k -> ConcurrentHashMap.newKeySet())
                .add(challenge.getId());

        return challenge;
    }

    public Challenge get(UUID challengeId) {
        return byId.get(challengeId);
    }

    /**
     * Atomically claims/removes a challenge. Returns the challenge if it was
     * actually present and removed, or null if it was already gone (already
     * accepted/declined/cancelled/expired by a concurrent call).
     */
    public Challenge removeIfPresent(UUID challengeId) {
        Challenge challenge = byId.remove(challengeId);
        if (challenge != null) {
            removeInternal(challenge);
        }
        return challenge;
    }

    /** Kept for explicit non-racy removals (decline/cancel), same as removeIfPresent. */
    public void remove(UUID challengeId) {
        removeIfPresent(challengeId);
    }

    private void removeInternal(Challenge challenge) {
        challenge.cancelExpiryTask();
        byId.remove(challenge.getId());
        byChallenger.remove(challenge.getChallengerId(), challenge);

        var set = byChallenged.get(challenge.getChallengedId());
        if (set != null) {
            set.remove(challenge.getId());
        }
    }

    public List<Challenge> getPendingFor(UUID userId) {
        var ids = byChallenged.get(userId);
        if (ids == null) return List.of();

        return ids.stream()
                .map(byId::get)
                .filter(c -> c != null && !c.isExpired())
                .toList();
    }

    public List<Challenge> cancelOutgoingForUser(UUID userId) {
        List<Challenge> cancelled = new java.util.ArrayList<>();

        Challenge outgoing = byChallenger.get(userId);
        if (outgoing != null) {
            Challenge removed = removeIfPresent(outgoing.getId());
            if (removed != null) cancelled.add(removed);
        }

        return cancelled;
    }
}