package com.chessy.chess_backend.repository;

import com.chessy.chess_backend.model.enums.gameGeneral.GameResultReason;
import com.chessy.chess_backend.entity.ComputerGame;
import com.chessy.chess_backend.model.Move;
import com.chessy.chess_backend.model.enums.gameGeneral.GameStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ComputerGameRepository extends JpaRepository<ComputerGame, UUID> {

    List<ComputerGame> findByUser_IdAndStatus(UUID userId, GameStatus status);

    /**
     * Returns all IN_PROGRESS computer games where it is currently the bot's
     * turn to move — used by the recovery scan on startup to re-publish
     * BotMoveRequestedEvent for any game whose event was lost mid-flight
     * (e.g. app crash between commit and the async listener finishing).
     *
     * Turn parity: white moves on even move-count (0, 2, 4, ...), black on
     * odd. It's the bot's turn when the user's color does NOT match the
     * side-to-move parity.
     */
    @Query(value = """
            SELECT * FROM computer_games
            WHERE status = 'IN_PROGRESS'
              AND (
                    (user_color = 'WHITE' AND jsonb_array_length(moves) % 2 = 1)
                 OR (user_color = 'BLACK' AND jsonb_array_length(moves) % 2 = 0)
              )
            """, nativeQuery = true)
    List<ComputerGame> findInProgressGamesAwaitingBotMove();

    /**
     * Applies a move atomically, guarded by moveVersion staleness check.
     * Chess legality/turn validation must already have happened in
     * application code before calling this — this WHERE clause guards only
     * against staleness (has moveVersion changed since it was read), not
     * legality. Used both when the user moves and when the bot moves; caller
     * passes whichever fen/moves/status result from that side's move.
     *
     * @return rows affected: 1 on success, 0 if the game was no longer
     * IN_PROGRESS or moveVersion had already advanced (conflict).
     */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE ComputerGame g SET " +
            "g.currentFen = :fen, " +
            "g.moves = :moves, " +
            "g.moveVersion = g.moveVersion + 1, " +
            "g.lastMoveAt = :now, " +
            "g.currentPlayerDeadlineAt = :deadline, " +
            "g.whiteTimeRemainingMs = :whiteTimeRemainingMs, " +
            "g.blackTimeRemainingMs = :blackTimeRemainingMs, " +
            "g.status = :newStatus, " +
            "g.result = :result, " +
            "g.resultReason = :resultReason, " +
            "g.finishedAt = :finishedAt " +
            "WHERE g.id = :gameId AND g.status = 'IN_PROGRESS' AND g.moveVersion = :readMoveVersion")
    int applyMoveIfCurrent(@Param("gameId") UUID gameId,
                           @Param("fen") String fen,
                           @Param("moves") List<Move> moves,
                           @Param("now") Instant now,
                           @Param("deadline") Instant deadline,
                           @Param("whiteTimeRemainingMs") Long whiteTimeRemainingMs,
                           @Param("blackTimeRemainingMs") Long blackTimeRemainingMs,
                           @Param("newStatus") GameStatus newStatus,
                           @Param("result") String result,
                           @Param("resultReason") GameResultReason resultReason,
                           @Param("finishedAt") Instant finishedAt,
                           @Param("readMoveVersion") int readMoveVersion);

    /**
     * Resignation is deliberately NOT pinned to moveVersion: a concurrent
     * move landing just before a resign is not a conflict, either is a
     * legitimate way for the game to end (first-committer-wins).
     */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE ComputerGame g SET " +
            "g.status = 'COMPLETED', " +
            "g.result = :result, " +
            "g.resultReason = :resultReason, " +
            "g.finishedAt = :finishedAt " +
            "WHERE g.id = :gameId AND g.status = 'IN_PROGRESS'")
    int resignIfInProgress(@Param("gameId") UUID gameId,
                           @Param("result") String result,
                           @Param("resultReason") GameResultReason resultReason,
                           @Param("finishedAt") Instant finishedAt);

    /**
     * Abort is legal only below a ply threshold. Checked directly against
     * live DB state (inequality), not pinned to a stale read, so a
     * concurrent move that doesn't push moveVersion past the threshold
     * doesn't spuriously block a valid abort.
     */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE ComputerGame g SET " +
            "g.status = 'ABORTED', " +
            "g.result = :result, " +
            "g.resultReason = :resultReason, " +
            "g.finishedAt = :finishedAt " +
            "WHERE g.id = :gameId AND g.status = 'IN_PROGRESS' AND g.moveVersion < :threshold")
    int abortIfBelowThreshold(@Param("gameId") UUID gameId,
                              @Param("result") String result,
                              @Param("resultReason") GameResultReason resultReason,
                              @Param("finishedAt") Instant finishedAt,
                              @Param("threshold") int threshold);

    /**
     * Timeout's validity depends on move data (the deadline is derived from
     * the last move), so like GameRepository, this IS pinned to moveVersion:
     * if a move landed between the scheduler's read and this write, the
     * timeout must fail rather than incorrectly end a game that just
     * continued.
     */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE ComputerGame g SET " +
            "g.status = 'COMPLETED', " +
            "g.result = :result, " +
            "g.resultReason = :resultReason, " +
            "g.finishedAt = :finishedAt, " +
            "g.whiteTimeRemainingMs = CASE WHEN :whiteToMove = true THEN 0 ELSE g.whiteTimeRemainingMs END, " +
            "g.blackTimeRemainingMs = CASE WHEN :whiteToMove = false THEN 0 ELSE g.blackTimeRemainingMs END " +
            "WHERE g.id = :gameId AND g.status = 'IN_PROGRESS' AND g.moveVersion = :readMoveVersion")
    int timeoutIfCurrent(@Param("gameId") UUID gameId,
                         @Param("result") String result,
                         @Param("resultReason") GameResultReason resultReason,
                         @Param("finishedAt") Instant finishedAt,
                         @Param("readMoveVersion") int readMoveVersion,
                         @Param("whiteToMove") boolean whiteToMove);

    List<ComputerGame> findByStatus(GameStatus status);

    @Query("select g from ComputerGame g join fetch g.user where g.id = :id")
    Optional<ComputerGame> findByIdWithUser(@Param("id") UUID id);
}