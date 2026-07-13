package com.chessy.chess_backend.service;

import com.chessy.chess_backend.controller.socketio.game.GameEventBroadcaster;
import com.chessy.chess_backend.entity.Game;
import com.chessy.chess_backend.event.GameDeadlineScheduledEvent;
import com.chessy.chess_backend.event.GameFinishedEvent;
import com.chessy.chess_backend.repository.GameRepository;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

/**
 * Server-authoritative, in-memory per-game timeout scheduler.
 *
 * For each IN_PROGRESS game, schedules exactly one task to fire at
 * currentPlayerDeadlineAt. Any prior task for that game is canceled first,
 * so only the final scheduled task per game ever actually runs.
 *
 * In-memory state is lost on restart, so on boot every IN_PROGRESS game is
 * re-scanned and re-scheduled (or immediately finalized if already expired).
 *
 * scheduleTimeoutCheck always re-reads current status/deadline from the DB
 * before arming, rather than trusting the caller-supplied deadline. This
 * makes each arm-decision self-correcting regardless of the order in which
 * AFTER_COMMIT listeners fire relative to other concurrent writes: if the
 * game has since ended or the deadline has moved, this re-read reflects
 * that. checkAndExpire/timeoutIfExpired separately re-reads and pins
 * moveVersion fresh at fire time for its own CAS attempt, so no gap remains.
 *
 * Single-instance only: if this app is ever horizontally scaled, this needs
 * external coordination (e.g. only the instance holding the game's websocket
 * connections schedules it, or a distributed lock) — out of scope per current
 * deployment.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GameTimeoutScheduler {

    private final GameService gameService;
    private final GameRepository gameRepository;
    private final GameEventBroadcaster broadcaster;

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
    private final ConcurrentHashMap<UUID, ScheduledFuture<?>> pendingTimeouts = new ConcurrentHashMap<>();

    @PostConstruct
    public void recoverOnStartup() {
        var inProgressGames = gameRepository.findByStatus(Game.GameStatus.IN_PROGRESS);
        log.info("Recovering timeout schedules for {} in-progress game(s)", inProgressGames.size());
        for (Game game : inProgressGames) {
            scheduleTimeoutCheck(game.getId(), game.getCurrentPlayerDeadlineAt());
        }
    }

    @PreDestroy
    public void shutdown() {
        scheduler.shutdownNow();
    }

    /**
     * Fired after a transaction that set/updated currentPlayerDeadlineAt commits
     * (i.e. after a move that doesn't end the game). AFTER_COMMIT with
     * fallbackExecution so this still fires in tests/contexts without an active tx.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onDeadlineScheduled(GameDeadlineScheduledEvent event) {
        scheduleTimeoutCheck(event.gameId(), event.deadline());
    }

    /**
     * Fired after a transaction that ended a game (any reason) commits.
     * Cancels any pending timeout task so it doesn't needlessly fire later.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onGameFinished(GameFinishedEvent event) {
        cancelScheduledTimeout(event.gameId());
    }

    /**
     * Re-reads current truth from the DB before arming, ignoring the
     * event-carried deadline entirely. If the game is no longer IN_PROGRESS,
     * or has no deadline set, this is a no-op — either the game already
     * ended or the clock hasn't started (matches existing isExpired
     * null-check semantics).
     */
    private void scheduleTimeoutCheck(UUID gameId, Instant ignoredEventDeadline) {
        Game current = gameRepository.findById(gameId).orElse(null);
        if (current == null || current.getStatus() != Game.GameStatus.IN_PROGRESS
                || current.getCurrentPlayerDeadlineAt() == null) {
            return; // superseded or game already ended by the time we got here
        }
        cancelScheduledTimeout(gameId);
        long delayMs = Math.max(0, Duration.between(Instant.now(), current.getCurrentPlayerDeadlineAt()).toMillis());
        ScheduledFuture<?> future = scheduler.schedule(
                () -> checkAndExpire(gameId), delayMs, TimeUnit.MILLISECONDS);
        pendingTimeouts.put(gameId, future);
    }

    private void cancelScheduledTimeout(UUID gameId) {
        ScheduledFuture<?> previous = pendingTimeouts.remove(gameId);
        if (previous != null) {
            previous.cancel(false);
        }
    }

    private void checkAndExpire(UUID gameId) {
        pendingTimeouts.remove(gameId);
        try {
            gameService.timeoutIfExpired(gameId).ifPresent(broadcaster::broadcastGameEnded);
        } catch (Exception e) {
            log.error("Failed to process scheduled timeout for game {}", gameId, e);
        }
    }
}