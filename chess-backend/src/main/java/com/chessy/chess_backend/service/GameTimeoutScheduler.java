package com.chessy.chess_backend.service;

import com.chessy.chess_backend.controller.socketio.game.GameEventBroadcaster;
import com.chessy.chess_backend.controller.socketio.computerGame.ComputerGameEventBroadcaster;
import com.chessy.chess_backend.entity.Game;
import com.chessy.chess_backend.entity.ComputerGame;
import com.chessy.chess_backend.event.computerGame.BotMoveRequestedEvent;
import com.chessy.chess_backend.event.onlineGame.GameDeadlineScheduledEvent;
import com.chessy.chess_backend.event.onlineGame.GameFinishedEvent;
import com.chessy.chess_backend.event.computerGame.ComputerGameDeadlineScheduledEvent;
import com.chessy.chess_backend.event.computerGame.ComputerGameFinishedEvent;
import com.chessy.chess_backend.model.enums.gameGeneral.GameStatus;
import com.chessy.chess_backend.repository.GameRepository;
import com.chessy.chess_backend.repository.ComputerGameRepository;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RBlockingQueue;
import org.redisson.api.RDelayedQueue;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.redisson.codec.TypedJsonJacksonCodec;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Server-authoritative per-game timeout scheduler, backed by Redis (Redisson)
 * so that scheduling is shared across horizontally-scaled instances instead
 * of living in local JVM memory.
 *
 * Handles both online games (Game) and computer games (ComputerGame) with
 * separate delayed queues, since they're distinct tables/services/events but
 * share identical scheduling semantics.
 *
 * For each IN_PROGRESS game, exactly one entry is enqueued onto a Redis
 * RDelayedQueue to fire at currentPlayerDeadlineAt. Any prior entry for that
 * game is removed first, so only the final scheduled entry per game ever
 * actually gets processed. Because the queue is shared across all instances
 * and each instance's consumer performs an atomic pop (RBlockingQueue.take(),
 * BLPOP-based under the hood), a given game's timeout is dequeued by exactly
 * one instance — no local-memory races between instances, mirroring the
 * delayed-queue pattern already used for challenge expiry.
 *
 * Both backing queues use TypedJsonJacksonCodec(UUID.class) explicitly —
 * without it, generic type erasure combined with the default codec
 * serializes UUID as a plain string, causing a ClassCastException on
 * dequeue (same failure mode fixed for the challenge expiry queue).
 *
 * In-memory local state no longer exists, but scheduling still needs to be
 * (re)populated on boot in case the Redis queue was flushed/lost or this is
 * a fresh deployment: on startup every IN_PROGRESS game is re-scanned and
 * re-enqueued (or immediately due if already expired). For computer games,
 * untimed games (currentPlayerDeadlineAt == null) are skipped entirely —
 * there's no deadline to enforce. This scan is guarded by a cluster-wide
 * RLock so that with N instances booting together, only one of them performs
 * the scan-and-enqueue, rather than N instances each enqueueing duplicate
 * entries for every game.
 *
 * Startup recovery also re-publishes BotMoveRequestedEvent for any computer
 * game left waiting on a bot move whose event was lost mid-flight (e.g. app
 * crash between the user's move committing and the async listener finishing
 * the bot's reply) — see recoverMissedBotMoves(). Timed games whose deadline
 * already passed while the app was down are deliberately skipped here: the
 * timeout re-scheduling above (already due, so it fires as soon as it's
 * enqueued) will resolve those instead, rather than racing a bot move
 * against a timeout that should win. recoverMissedBotMoves() runs under the
 * same startup lock as the timeout scan, so it too only executes once per
 * deployment/restart cycle rather than once per instance.
 *
 * scheduleTimeoutCheck/scheduleComputerTimeoutCheck always re-read current
 * status/deadline from the DB before enqueueing, rather than trusting the
 * caller-supplied deadline. This makes each enqueue-decision self-correcting
 * regardless of the order in which AFTER_COMMIT listeners fire relative to
 * other concurrent writes: if the game has since ended or the deadline has
 * moved, this re-read reflects that. checkAndExpire/timeoutIfExpired
 * separately re-reads and pins moveVersion fresh at fire time for its own
 * CAS attempt, so no gap remains. That CAS/version-check is a backstop for
 * the rare case where a consumer thread dies or Redis loses queue state —
 * not something routine multi-instance firing should ever need to rely on,
 * since cancelScheduledTimeout/cancelScheduledComputerTimeout now remove the
 * stale entry from the shared queue directly (see below) rather than
 * depending on a redundant fire being silently absorbed.
 *
 * KNOWN OPEN ITEM (pending verification): RDelayedQueue tracks not-yet-due
 * entries internally (separate from the backing queue), and remove() may not
 * reliably purge an entry before its delay has elapsed. If so, a cancelled
 * game's timeout entry could still be dequeued and processed later as a
 * no-op (caught by the CAS backstop) rather than being truly removed. Needs
 * to be verified against the actual Redis instance; not yet confirmed either
 * way.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GameTimeoutScheduler {

    private final GameService gameService;
    private final GameRepository gameRepository;
    private final GameEventBroadcaster broadcaster;

    private final ComputerGameService computerGameService;
    private final ComputerGameRepository computerGameRepository;
    private final ComputerGameEventBroadcaster computerGameBroadcaster;

    private final ApplicationEventPublisher eventPublisher;
    private final RedissonClient redisson;

    private static final String GAME_TIMEOUT_QUEUE_KEY = "game-timeouts:queue";
    private static final String COMPUTER_GAME_TIMEOUT_QUEUE_KEY = "computer-game-timeouts:queue";
    private static final String STARTUP_RECOVERY_LOCK_KEY = "lock:game-timeout-startup-recovery";
    private static final long STARTUP_RECOVERY_LOCK_WAIT_SECONDS = 5;

    private RBlockingQueue<UUID> gameTimeoutBackingQueue;
    private RDelayedQueue<UUID> gameTimeoutQueue;
    private RBlockingQueue<UUID> computerGameTimeoutBackingQueue;
    private RDelayedQueue<UUID> computerGameTimeoutQueue;

    private Thread gameTimeoutConsumer;
    private Thread computerGameTimeoutConsumer;
    private volatile boolean running = true;

    @PostConstruct
    public void init() {
        initQueues();
        startConsumerThreads();
        runStartupRecovery();
    }

    private void initQueues() {
        gameTimeoutBackingQueue = redisson.getBlockingQueue(GAME_TIMEOUT_QUEUE_KEY, new TypedJsonJacksonCodec(UUID.class));
        gameTimeoutQueue = redisson.getDelayedQueue(gameTimeoutBackingQueue);

        computerGameTimeoutBackingQueue = redisson.getBlockingQueue(COMPUTER_GAME_TIMEOUT_QUEUE_KEY, new TypedJsonJacksonCodec(UUID.class));
        computerGameTimeoutQueue = redisson.getDelayedQueue(computerGameTimeoutBackingQueue);
    }

    private void startConsumerThreads() {
        gameTimeoutConsumer = new Thread(this::consumeGameTimeouts, "game-timeout-consumer");
        gameTimeoutConsumer.setDaemon(true);
        gameTimeoutConsumer.start();

        computerGameTimeoutConsumer = new Thread(this::consumeComputerGameTimeouts, "computer-game-timeout-consumer");
        computerGameTimeoutConsumer.setDaemon(true);
        computerGameTimeoutConsumer.start();
    }

    /**
     * Blocks (BLPOP-based, atomic pop) on the shared game-timeout queue.
     * Because the pop is atomic and the queue is shared across instances,
     * a given gameId is delivered to exactly one instance.
     */
    private void consumeGameTimeouts() {
        while (running) {
            try {
                UUID gameId = gameTimeoutBackingQueue.take();
                checkAndExpire(gameId);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.error("Unexpected error in game timeout consumer", e);
            }
        }
    }

    private void consumeComputerGameTimeouts() {
        while (running) {
            try {
                UUID gameId = computerGameTimeoutBackingQueue.take();
                checkAndExpireComputerGame(gameId);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.error("Unexpected error in computer game timeout consumer", e);
            }
        }
    }

    /**
     * Cluster-wide guarded entry point for startup recovery. Only one
     * instance across the deployment actually performs the DB scan and
     * re-enqueue / bot-move republish; the rest skip it entirely, since
     * scheduling state now lives in shared Redis queues rather than local
     * memory, so there is nothing instance-specific left to recover.
     */
    private void runStartupRecovery() {
        RLock lock = redisson.getLock(STARTUP_RECOVERY_LOCK_KEY);
        boolean acquired = false;
        try {
            acquired = lock.tryLock(STARTUP_RECOVERY_LOCK_WAIT_SECONDS, TimeUnit.SECONDS);
            if (!acquired) {
                log.info("Another instance is already performing game timeout startup recovery; skipping.");
                return;
            }
            performStartupRecovery();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Interrupted while waiting for startup recovery lock", e);
        } finally {
            if (acquired && lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    private void performStartupRecovery() {
        var inProgressGames = gameRepository.findByStatus(GameStatus.IN_PROGRESS);
        log.info("Recovering timeout schedules for {} in-progress game(s)", inProgressGames.size());
        for (Game game : inProgressGames) {
            scheduleTimeoutCheck(game.getId(), game.getCurrentPlayerDeadlineAt());
        }

        var inProgressComputerGames = computerGameRepository.findByStatus(GameStatus.IN_PROGRESS);
        long timedCount = inProgressComputerGames.stream()
                .filter(g -> g.isTimed() && g.getCurrentPlayerDeadlineAt() != null)
                .count();
        log.info("Recovering timeout schedules for {} in-progress computer game(s) ({} timed)",
                inProgressComputerGames.size(), timedCount);
        for (ComputerGame game : inProgressComputerGames) {
            if (game.isTimed()) {
                scheduleComputerTimeoutCheck(game.getId());
            }
        }

        recoverMissedBotMoves();
    }

    /**
     * Re-publishes BotMoveRequestedEvent for any IN_PROGRESS computer game
     * where it's currently the bot's turn — covering games whose original
     * event was lost mid-flight (app crash between the user's move
     * committing and BotMoveRequestedListener finishing the bot's reply).
     *
     * Runs under the same startup-recovery lock as performStartupRecovery(),
     * so exactly one instance republishes per deployment/restart cycle
     * rather than every instance independently.
     *
     * Skips games whose timed deadline has already passed: that game's
     * timeout entry was just enqueued above (already due, so it fires as
     * soon as the consumer picks it up) and will resolve it as a timeout.
     * Publishing a bot-move event for it too would race the timeout, and —
     * since applyMove() does not re-validate the deadline that was already
     * in force before this move — the bot move could win that race and
     * incorrectly continue a game that should have ended on time.
     */
    private void recoverMissedBotMoves() {
        List<ComputerGame> awaitingBotMove = computerGameRepository.findInProgressGamesAwaitingBotMove();
        int published = 0;
        int skippedExpired = 0;

        for (ComputerGame game : awaitingBotMove) {
            if (game.isTimed() && isDeadlineAlreadyPassed(game)) {
                skippedExpired++;
                continue;
            }
            eventPublisher.publishEvent(new BotMoveRequestedEvent(game.getId()));
            published++;
        }

        log.info("Recovering {} missed bot move(s) on startup ({} skipped as already timed out)",
                published, skippedExpired);
    }

    private boolean isDeadlineAlreadyPassed(ComputerGame game) {
        Instant deadline = game.getCurrentPlayerDeadlineAt();
        return deadline != null && Instant.now().isAfter(deadline);
    }

    @PreDestroy
    public void shutdown() {
        running = false;
        if (gameTimeoutConsumer != null) {
            gameTimeoutConsumer.interrupt();
        }
        if (computerGameTimeoutConsumer != null) {
            computerGameTimeoutConsumer.interrupt();
        }
        if (gameTimeoutQueue != null) {
            gameTimeoutQueue.destroy();
        }
        if (computerGameTimeoutQueue != null) {
            computerGameTimeoutQueue.destroy();
        }
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
     * Removes any pending timeout entry from the shared queue so it doesn't
     * needlessly fire later on whichever instance dequeues it.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onGameFinished(GameFinishedEvent event) {
        cancelScheduledTimeout(event.gameId());
    }

    /**
     * Computer-game counterparts. Only published for timed games (see
     * ComputerGameService), so no isTimed check needed here — the event's
     * existence already implies it.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onComputerGameDeadlineScheduled(ComputerGameDeadlineScheduledEvent event) {
        scheduleComputerTimeoutCheck(event.gameId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onComputerGameFinished(ComputerGameFinishedEvent event) {
        cancelScheduledComputerTimeout(event.gameId());
    }

    /**
     * Re-reads current truth from the DB before enqueueing, ignoring the
     * event-carried deadline entirely. If the game is no longer IN_PROGRESS,
     * or has no deadline set, this is a no-op — either the game already
     * ended or the clock hasn't started (matches existing isExpired
     * null-check semantics). Any previously-queued entry for this game is
     * removed first so only the latest deadline is ever live in the queue.
     */
    private void scheduleTimeoutCheck(UUID gameId, Instant ignoredEventDeadline) {
        Game current = gameRepository.findById(gameId).orElse(null);
        if (current == null || current.getStatus() != GameStatus.IN_PROGRESS
                || current.getCurrentPlayerDeadlineAt() == null) {
            return; // superseded or game already ended by the time we got here
        }
        cancelScheduledTimeout(gameId);
        long delayMs = Math.max(0, Duration.between(Instant.now(), current.getCurrentPlayerDeadlineAt()).toMillis());
        gameTimeoutQueue.offer(gameId, delayMs, TimeUnit.MILLISECONDS);
    }

    /**
     * Same re-read-before-enqueue approach as scheduleTimeoutCheck, but also
     * re-checks isTimed() — an untimed game has no deadline to enforce and
     * is always a no-op here.
     */
    private void scheduleComputerTimeoutCheck(UUID gameId) {
        ComputerGame current = computerGameRepository.findById(gameId).orElse(null);
        if (current == null || current.getStatus() != GameStatus.IN_PROGRESS
                || !current.isTimed() || current.getCurrentPlayerDeadlineAt() == null) {
            return; // superseded, untimed, or game already ended by the time we got here
        }
        cancelScheduledComputerTimeout(gameId);
        long delayMs = Math.max(0, Duration.between(Instant.now(), current.getCurrentPlayerDeadlineAt()).toMillis());
        computerGameTimeoutQueue.offer(gameId, delayMs, TimeUnit.MILLISECONDS);
    }

    /**
     * Removes a pending entry from the shared delayed queue, cluster-wide —
     * not just from local state. If no entry exists (already fired, already
     * cancelled, or never scheduled), this is a harmless no-op.
     */
    private void cancelScheduledTimeout(UUID gameId) {
        gameTimeoutQueue.remove(gameId);
    }

    private void cancelScheduledComputerTimeout(UUID gameId) {
        computerGameTimeoutQueue.remove(gameId);
    }

    private void checkAndExpire(UUID gameId) {
        try {
            gameService.timeoutIfExpired(gameId).ifPresent(broadcaster::broadcastGameEnded);
        } catch (Exception e) {
            log.error("Failed to process scheduled timeout for game {}", gameId, e);
        }
    }

    private void checkAndExpireComputerGame(UUID gameId) {
        try {
            computerGameService.timeoutIfExpired(gameId).ifPresent(computerGameBroadcaster::broadcastGameEnded);
        } catch (Exception e) {
            log.error("Failed to process scheduled timeout for computer game {}", gameId, e);
        }
    }
}