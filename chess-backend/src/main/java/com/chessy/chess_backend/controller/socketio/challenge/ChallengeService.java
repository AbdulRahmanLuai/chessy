package com.chessy.chess_backend.controller.socketio.challenge;

import org.springframework.stereotype.Service;

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

    // one active outgoing challenge per challenger
    private final Map<UUID, Challenge> byChallenger = new ConcurrentHashMap<>();
    // lookup by challengeId for accept/decline
    private final Map<UUID, Challenge> byId = new ConcurrentHashMap<>();
    // reverse index: challenged user -> their pending incoming challenge(s)
    // kept as challengerId->Challenge is enough since 1 outgoing per user;
    // but a user can receive from multiple challengers, so index by challengedId -> set of challenge ids
    private final Map<UUID, ConcurrentHashMap.KeySetView<UUID, Boolean>> byChallenged = new ConcurrentHashMap<>();

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

    /**
     * Creates a new challenge, overriding any existing one from the same challenger.
     * onOverride is called with the old challenge if one existed, so the caller can notify the old target.
     * onExpire is called when the challenge naturally times out.
     */
    public Challenge create(UUID challengerId, UUID challengedId,
                            BiConsumer<Challenge, String> onOverrideOrCancel,
                            BiConsumer<Challenge, String> onExpire) {

        Challenge existing = byChallenger.get(challengerId);
        if (existing != null) {
            removeInternal(existing);
            onOverrideOrCancel.accept(existing, "overridden");
        }

        Challenge challenge = new Challenge(challengerId, challengedId, TTL_SECONDS);

        var expiryTask = scheduler.schedule(() -> {
            Challenge stillActive = byId.get(challenge.getId());
            if (stillActive != null) {
                removeInternal(stillActive);
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

    /** Called on accept/decline/explicit cancel to fully remove the challenge. */
    public void remove(UUID challengeId) {
        Challenge challenge = byId.get(challengeId);
        if (challenge != null) {
            removeInternal(challenge);
        }
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

    /** Used on user connect to deliver any pending challenges addressed to them. */
    public java.util.List<Challenge> getPendingFor(UUID userId) {
        var ids = byChallenged.get(userId);
        if (ids == null) return java.util.List.of();

        return ids.stream()
                .map(byId::get)
                .filter(c -> c != null && !c.isExpired())
                .toList();
    }
}