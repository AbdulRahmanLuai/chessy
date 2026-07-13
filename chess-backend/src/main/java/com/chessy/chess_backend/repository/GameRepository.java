package com.chessy.chess_backend.repository;

import com.chessy.chess_backend.entity.Game;
import com.chessy.chess_backend.model.Move;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface GameRepository extends JpaRepository<Game, UUID> {

    @Query("SELECT COUNT(g) > 0 FROM Game g " +
            "WHERE (g.whitePlayer.id = :userId OR g.blackPlayer.id = :userId) " +
            "AND g.status IN ('WAITING', 'IN_PROGRESS')")
    boolean hasActiveGame(@Param("userId") UUID userId);

    List<Game> findByStatus(Game.GameStatus status);

    /**
     * Applies a move atomically, guarded by moveVersion staleness check.
     * Also clears any pending draw offer (a move always supersedes it) and,
     * if the move ends the game, sets terminal status/result in the same
     * statement. Chess legality/turn validation must already have happened
     * in application code before calling this — this WHERE clause guards
     * only against staleness (has moveVersion changed since it was read),
     * not legality.
     *
     * @return rows affected: 1 on success, 0 if the game was no longer
     *         IN_PROGRESS or moveVersion had already advanced (conflict).
     */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Game g SET " +
            "g.currentFen = :fen, " +
            "g.moves = :moves, " +
            "g.moveVersion = g.moveVersion + 1, " +
            "g.lastMoveAt = :now, " +
            "g.currentPlayerDeadlineAt = :deadline, " +
            "g.whiteTimeRemainingMs = :whiteTimeRemainingMs, " +
            "g.blackTimeRemainingMs = :blackTimeRemainingMs, " +
            "g.pendingDrawOfferedBy = NULL, " +
            "g.drawVersion = g.drawVersion + 1, " +
            "g.status = :newStatus, " +
            "g.result = :result, " +
            "g.resultReason = :resultReason, " +
            "g.winner = :winner, " +
            "g.finishedAt = :finishedAt " +
            "WHERE g.id = :gameId AND g.status = 'IN_PROGRESS' AND g.moveVersion = :readMoveVersion")
    int applyMoveIfCurrent(@Param("gameId") UUID gameId,
                           @Param("fen") String fen,
                           @Param("moves") List<Move> moves,
                           @Param("now") Instant now,
                           @Param("deadline") Instant deadline,
                           @Param("whiteTimeRemainingMs") long whiteTimeRemainingMs,
                           @Param("blackTimeRemainingMs") long blackTimeRemainingMs,
                           @Param("newStatus") Game.GameStatus newStatus,
                           @Param("result") String result,
                           @Param("resultReason") String resultReason,
                           @Param("winner") UUID winner,
                           @Param("finishedAt") Instant finishedAt,
                           @Param("readMoveVersion") int readMoveVersion);

    /**
     * Resignation is deliberately NOT pinned to moveVersion: a concurrent
     * move landing just before a resign is not a conflict, either is a
     * legitimate way for the game to end (first-committer-wins).
     */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Game g SET " +
            "g.status = 'COMPLETED', " +
            "g.result = :result, " +
            "g.resultReason = :resultReason, " +
            "g.winner = :winner, " +
            "g.finishedAt = :finishedAt " +
            "WHERE g.id = :gameId AND g.status = 'IN_PROGRESS'")
    int resignIfInProgress(@Param("gameId") UUID gameId,
                           @Param("result") String result,
                           @Param("resultReason") String resultReason,
                           @Param("winner") UUID winner,
                           @Param("finishedAt") Instant finishedAt);

    /**
     * Abort is legal only below a ply threshold. Checked directly against
     * live DB state (inequality), not pinned to a stale read, so a
     * concurrent move that doesn't push moveVersion past the threshold
     * doesn't spuriously block a valid abort.
     */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Game g SET " +
            "g.status = 'ABORTED', " +
            "g.result = :result, " +
            "g.resultReason = :resultReason, " +
            "g.finishedAt = :finishedAt " +
            "WHERE g.id = :gameId AND g.status = 'IN_PROGRESS' AND g.moveVersion < :threshold")
    int abortIfBelowThreshold(@Param("gameId") UUID gameId,
                              @Param("result") String result,
                              @Param("resultReason") String resultReason,
                              @Param("finishedAt") Instant finishedAt,
                              @Param("threshold") int threshold);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Game g SET " +
            "g.pendingDrawOfferedBy = :userId, " +
            "g.drawVersion = g.drawVersion + 1 " +
            "WHERE g.id = :gameId AND g.status = 'IN_PROGRESS'")
    int offerDrawIfInProgress(@Param("gameId") UUID gameId, @Param("userId") UUID userId);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Game g SET " +
            "g.pendingDrawOfferedBy = NULL, " +
            "g.drawVersion = g.drawVersion + 1 " +
            "WHERE g.id = :gameId AND g.status = 'IN_PROGRESS' " +
            "AND g.drawVersion = :readDrawVersion AND g.pendingDrawOfferedBy IS NOT NULL")
    int declineDrawIfCurrent(@Param("gameId") UUID gameId, @Param("readDrawVersion") int readDrawVersion);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Game g SET " +
            "g.status = 'COMPLETED', " +
            "g.result = '1/2-1/2', " +
            "g.resultReason = :resultReason, " +
            "g.pendingDrawOfferedBy = NULL, " +
            "g.finishedAt = :finishedAt " +
            "WHERE g.id = :gameId AND g.status = 'IN_PROGRESS' " +
            "AND g.drawVersion = :readDrawVersion AND g.pendingDrawOfferedBy IS NOT NULL")
    int acceptDrawIfCurrent(@Param("gameId") UUID gameId,
                            @Param("resultReason") String resultReason,
                            @Param("finishedAt") Instant finishedAt,
                            @Param("readDrawVersion") int readDrawVersion);

    /**
     * Timeout's validity depends on move data (the deadline is derived from
     * the last move), so unlike resign, this IS pinned to moveVersion: if a
     * move landed between the scheduler's read and this write, the timeout
     * must fail rather than incorrectly end a game that just continued.
     */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Game g SET " +
            "g.status = 'COMPLETED', " +
            "g.result = :result, " +
            "g.resultReason = :resultReason, " +
            "g.winner = :winner, " +
            "g.finishedAt = :finishedAt " +
            "WHERE g.id = :gameId AND g.status = 'IN_PROGRESS' AND g.moveVersion = :readMoveVersion")
    int timeoutIfCurrent(@Param("gameId") UUID gameId,
                         @Param("result") String result,
                         @Param("resultReason") String resultReason,
                         @Param("winner") UUID winner,
                         @Param("finishedAt") Instant finishedAt,
                         @Param("readMoveVersion") int readMoveVersion);
}