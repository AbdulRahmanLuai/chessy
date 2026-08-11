package com.chessy.chess_backend.controller.socketio.challenge;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.redisson.api.*;
import org.redisson.api.map.event.EntryExpiredListener;
import org.redisson.codec.TypedJsonJacksonCodec;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.function.BiConsumer;

@Service
public class ChallengeService {

    private static final long TTL_SECONDS = 30;

    // Backstop TTL for byId/byChallenger/challengedSet, intentionally longer than TTL_SECONDS.
    // Must stay strictly greater than TTL_SECONDS: RMapCache/RSetCache check their own internal
    // expiry bookkeeping on every read/write (not just on Redis's background eviction sweep), so
    // if this equals TTL_SECONDS, removeIfPresent() called by the delayed-queue consumer right at
    // the TTL boundary can see the entry as "already expired" and return null even though the real
    // eviction/EntryExpiredListener hasn't fired yet - causing the precise delayed-queue path to
    // silently lose the race to the slower/lazier backstop listener every time.
    private static final long MAP_TTL_SECONDS = TTL_SECONDS + 15;

    private final RedissonClient redisson;
    private final RMapCache<UUID, Challenge> byId;
    private final RMapCache<UUID, UUID> byChallenger;
    private final RBlockingQueue<UUID> expiryQueue;
    private final RDelayedQueue<UUID> delayedExpiryQueue;
    private final ExecutorService expiryConsumerExecutor = Executors.newSingleThreadExecutor();
    private final RTopic challengeEventsTopic;

    public ChallengeService(RedissonClient redisson) {
        this.redisson = redisson;
        this.byId = redisson.getMapCache("challenges:byId");
        this.byChallenger = redisson.getMapCache("challenges:byChallenger");
        this.expiryQueue = redisson.getBlockingQueue(
                "challenges:expiryQueue",
                new TypedJsonJacksonCodec(UUID.class)
        );
        this.delayedExpiryQueue = redisson.getDelayedQueue(expiryQueue);
        this.challengeEventsTopic = redisson.getTopic("challenges:events");
    }

    private RSetCache<UUID> challengedSet(UUID challengedId) {
        return redisson.getSetCache("challenges:byChallenged:" + challengedId);
    }

    public Challenge create(UUID challengerId, UUID challengedId, String preferredColor,
                            Integer timeLimitSeconds, Integer incrementSeconds) {

        if (timeLimitSeconds == null || timeLimitSeconds <= 0) {
            throw new IllegalArgumentException("Time limit must be set and more than 0");
        }

        UUID existingId = byChallenger.get(challengerId);
        if (existingId != null) {
            Challenge existing = removeIfPresent(existingId);
            if (existing != null) {
                challengeEventsTopic.publish(new ChallengeEndedMessage(
                        existing.getId(), existing.getChallengerId(), existing.getChallengedId(), "overridden"
                ));
            }
        }

        Challenge challenge = new Challenge(challengerId, challengedId, preferredColor, timeLimitSeconds, incrementSeconds, TTL_SECONDS);

        byId.put(challenge.getId(), challenge, MAP_TTL_SECONDS, TimeUnit.SECONDS);
        byChallenger.put(challengerId, challenge.getId(), MAP_TTL_SECONDS, TimeUnit.SECONDS);
        challengedSet(challengedId).add(challenge.getId(), MAP_TTL_SECONDS, TimeUnit.SECONDS);

        delayedExpiryQueue.offer(challenge.getId(), TTL_SECONDS, TimeUnit.SECONDS);

        return challenge;
    }

    public Challenge get(UUID challengeId) {
        return byId.get(challengeId);
    }

    public Challenge removeIfPresent(UUID challengeId) {
        Challenge challenge = byId.remove(challengeId);
        if (challenge != null) {
            byChallenger.remove(challenge.getChallengerId(), challenge.getId());
            challengedSet(challenge.getChallengedId()).remove(challenge.getId());
        }
        return challenge;
    }

    public void remove(UUID challengeId) {
        removeIfPresent(challengeId);
    }

    @PostConstruct
    private void registerExpiryListener() {
        byId.addListener((EntryExpiredListener<UUID, Challenge>) event -> {
            Challenge expired = event.getValue();
            byChallenger.remove(expired.getChallengerId(), expired.getId());
            challengedSet(expired.getChallengedId()).remove(expired.getId());
            challengeEventsTopic.publish(new ChallengeEndedMessage(
                    expired.getId(), expired.getChallengerId(), expired.getChallengedId(), "expired"
            ));
        });

        expiryConsumerExecutor.submit(this::consumeExpiries);
    }

    // TODO (part C): guard create()'s override-check race with an RLock scoped to challengerId
    // TODO (part B): replace onExpireCallback with pub/sub publish so any instance can notify
    private void consumeExpiries() {
        while (!Thread.currentThread().isInterrupted()) {
            try {
                UUID challengeId = expiryQueue.take(); // blocks until an item is ready
                Challenge expired = removeIfPresent(challengeId);
                if (expired != null) {
                    challengeEventsTopic.publish(new ChallengeEndedMessage(
                            expired.getId(), expired.getChallengerId(), expired.getChallengedId(), "expired"
                    ));
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt(); // restore interrupt flag, exit loop
            } catch (Exception e) {
                // don't let one bad item kill the whole consumer loop
                e.printStackTrace();
            }
        }
    }

    @PreDestroy
    private void shutdownDelayedQueue() {
        delayedExpiryQueue.destroy();
        expiryConsumerExecutor.shutdownNow();
    }

    public List<Challenge> getPendingFor(UUID userId) {
        return challengedSet(userId).stream()
                .map(byId::get)
                .filter(Objects::nonNull)
                .toList();
    }

    public List<Challenge> cancelOutgoingForUser(UUID userId) {
        List<Challenge> cancelled = new ArrayList<>();
        UUID outgoingId = byChallenger.get(userId);
        if (outgoingId != null) {
            Challenge removed = removeIfPresent(outgoingId);
            if (removed != null) cancelled.add(removed);
        }
        return cancelled;
    }
}