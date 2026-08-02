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
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

/**
 * Server-authoritative, in-memory per-game timeout scheduler.
 *
 * Handles both online games (Game) and computer games (ComputerGame) with
 * separate tracking maps, since they're distinct tables/services/events but
 * share identical scheduling semantics.
 *
 * For each IN_PROGRESS game, schedules exactly one task to fire at
 * currentPlayerDeadlineAt. Any prior task for that game is canceled first,
 * so only the final scheduled task per game ever actually runs.
 *
 * In-memory state is lost on restart, so on boot every IN_PROGRESS game is
 * re-scanned and re-scheduled (or immediately finalized if already expired).
 * For computer games, untimed games (currentPlayerDeadlineAt == null) are
 * skipped entirely — there's no deadline to enforce.
 *
 * Startup recovery also re-publishes BotMoveRequestedEvent for any computer
 * game left waiting on a bot move whose event was lost mid-flight (e.g. app
 * crash between the user's move committing and the async listener finishing
 * the bot's reply) — see recoverMissedBotMoves(). Timed games whose deadline
 * already passed while the app was down are deliberately skipped here: the
 * timeout re-scheduling above (already armed with ~0 delay for expired
 * games) will resolve those instead, rather than racing a bot move against
 * a timeout that should win.
 *
 * scheduleTimeoutCheck/scheduleComputerTimeoutCheck always re-read current
 * status/deadline from the DB before arming, rather than trusting the
 * caller-supplied deadline. This makes each arm-decision self-correcting
 * regardless of the order in which AFTER_COMMIT listeners fire relative to
 * other concurrent writes: if the game has since ended or the deadline has
 * moved, this re-read reflects that. checkAndExpire/timeoutIfExpired
 * separately re-reads and pins moveVersion fresh at fire time for its own
 * CAS attempt, so no gap remains.
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

    private final ComputerGameService computerGameService;
    private final ComputerGameRepository computerGameRepository;
    private final ComputerGameEventBroadcaster computerGameBroadcaster;

    private final ApplicationEventPublisher eventPublisher;

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);
    private final ConcurrentHashMap<UUID, ScheduledFuture<?>> pendingTimeouts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<UUID, ScheduledFuture<?>> pendingComputerTimeouts = new ConcurrentHashMap<>();

    @PostConstruct
    public void recoverOnStartup() {
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
     * Skips games whose timed deadline has already passed: that game's
     * timeout task was just armed above (with ~0 delay, since it's already
     * expired) and will resolve it as a timeout. Publishing a bot-move event
     * for it too would race the timeout, and — since applyMove() does not
     * re-validate the deadline that was already in force before this move —
     * the bot move could win that race and incorrectly continue a game that
     * should have ended on time.
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
     * Re-reads current truth from the DB before arming, ignoring the
     * event-carried deadline entirely. If the game is no longer IN_PROGRESS,
     * or has no deadline set, this is a no-op — either the game already
     * ended or the clock hasn't started (matches existing isExpired
     * null-check semantics).
     */
    private void scheduleTimeoutCheck(UUID gameId, Instant ignoredEventDeadline) {
        Game current = gameRepository.findById(gameId).orElse(null);
        if (current == null || current.getStatus() != GameStatus.IN_PROGRESS
                || current.getCurrentPlayerDeadlineAt() == null) {
            return; // superseded or game already ended by the time we got here
        }
        cancelScheduledTimeout(gameId);
        long delayMs = Math.max(0, Duration.between(Instant.now(), current.getCurrentPlayerDeadlineAt()).toMillis());
        ScheduledFuture<?> future = scheduler.schedule(
                () -> checkAndExpire(gameId), delayMs, TimeUnit.MILLISECONDS);
        pendingTimeouts.put(gameId, future);
    }

    /**
     * Same re-read-before-arm approach as scheduleTimeoutCheck, but also
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
        ScheduledFuture<?> future = scheduler.schedule(
                () -> checkAndExpireComputerGame(gameId), delayMs, TimeUnit.MILLISECONDS);
        pendingComputerTimeouts.put(gameId, future);
    }

    private void cancelScheduledTimeout(UUID gameId) {
        ScheduledFuture<?> previous = pendingTimeouts.remove(gameId);
        if (previous != null) {
            previous.cancel(false);
        }
    }

    private void cancelScheduledComputerTimeout(UUID gameId) {
        ScheduledFuture<?> previous = pendingComputerTimeouts.remove(gameId);
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

    private void checkAndExpireComputerGame(UUID gameId) {
        pendingComputerTimeouts.remove(gameId);
        try {
            computerGameService.timeoutIfExpired(gameId).ifPresent(computerGameBroadcaster::broadcastGameEnded);
        } catch (Exception e) {
            log.error("Failed to process scheduled timeout for computer game {}", gameId, e);
        }
    }
}