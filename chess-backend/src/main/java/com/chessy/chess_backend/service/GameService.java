package com.chessy.chess_backend.service;

import com.chessy.chess_backend.controller.socketio.game.event.MoveAppliedEvent;
import com.chessy.chess_backend.controller.socketio.game.payload.MovePayload;
import com.chessy.chess_backend.dto.*;
import com.chessy.chess_backend.entity.Game;
import com.chessy.chess_backend.event.GameDeadlineScheduledEvent;
import com.chessy.chess_backend.event.GameFinishedEvent;
import com.chessy.chess_backend.exception.*;
import com.chessy.chess_backend.mapper.GameMapper;
import com.chessy.chess_backend.mapper.MoveMapper;
import com.chessy.chess_backend.repository.GameRepository;
import com.chessy.chess_backend.repository.UserRepository;
import com.github.bhlangonijr.chesslib.move.MoveGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.bhlangonijr.chesslib.*;
import com.github.bhlangonijr.chesslib.move.Move;
import com.github.bhlangonijr.chesslib.move.MoveConversionException;
import com.github.bhlangonijr.chesslib.move.MoveList;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GameService {

    private final GameRepository gameRepository;
    private final GameMapper gameMapper;
    private final MoveMapper moveMapper;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    public CreateGameResponseDto createGame(UUID whitePlayerId, UUID blackPlayerId) {

        int gracePeriodSeconds = 2;
        int timeLimitSeconds = 30;
        int incrementSeconds = 1;
        // TODO: take game settings from challenge payload

        Instant now = Instant.now();
        Instant clockStartsAt = now.plus(gracePeriodSeconds, ChronoUnit.SECONDS);
        long timeLimitMs = timeLimitSeconds * 1000L;

        Game game = Game.builder()
                .whitePlayer(userRepository.getById(whitePlayerId))
                .blackPlayer(userRepository.getById(blackPlayerId))
                .status(Game.GameStatus.IN_PROGRESS)
                .currentFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
                .moves(new ArrayList<>())
                .timeInitialSeconds(timeLimitSeconds)
                .timeIncrementSeconds(incrementSeconds)
                .whiteTimeRemainingMs(timeLimitMs)
                .blackTimeRemainingMs(timeLimitMs)
                .currentPlayerDeadlineAt(clockStartsAt.plus(timeLimitSeconds, ChronoUnit.SECONDS))
                .lastMoveAt(clockStartsAt) // grace period before clock starts
                .moveVersion(0)
                .drawVersion(0)
                .build();

        Game saved = gameRepository.save(game);
        eventPublisher.publishEvent(new GameDeadlineScheduledEvent(saved.getId(), saved.getCurrentPlayerDeadlineAt()));

        return CreateGameResponseDto.builder()
                .gameId(saved.getId())
                .build();
    }

    @Transactional(readOnly = true)
    public GameDto getGame(UUID gameId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        return gameMapper.toDto(game);
    }

    public MoveListDto getMoves(UUID gameId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        return MoveListDto.builder()
                .gameId(game.getId())
                .moves(game.getMoves().stream()
                        .map(moveMapper::toDto)
                        .toList())
                .build();
    }

    public Boolean hasActiveGame(UUID userId) {
        return gameRepository.hasActiveGame(userId);
    }

    @Transactional
    public GameDto startGame(UUID gameId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow();

        game.setStatus(Game.GameStatus.IN_PROGRESS);
        gameRepository.save(game);

        return gameMapper.toDto(game);
    }

    @Transactional
    public GameMoveResult applyMove(UUID gameId, UUID userId, MovePayload payload) {
        ParticipantContext ctx = loadActiveParticipant(gameId, userId);
        Game game = ctx.game();
        boolean isWhite = ctx.isWhite();
        boolean isBlack = ctx.isBlack();
        int readMoveVersion = game.getMoveVersion();

        // Force-initialize lazy player proxies now, while the session is still
        // active. applyMoveIfCurrent below runs with clearAutomatically = true,
        // which detaches the persistence context — after that, gameMapper.toDto(game)
        // would fail trying to lazy-load these outside a session.
        org.hibernate.Hibernate.initialize(game.getWhitePlayer());
        org.hibernate.Hibernate.initialize(game.getBlackPlayer());


        Board board = new Board();
        MoveList moveList = new MoveList();
        for (Move historyMove : game.getMoves().stream().map(this::moveFromEntity).toList()) {
            board.doMove(historyMove);
            moveList.add(historyMove);
        }

        Side sideToMove = board.getSideToMove();
        boolean isUsersTurn = (sideToMove == Side.WHITE && isWhite) || (sideToMove == Side.BLACK && isBlack);
        if (!isUsersTurn) {
            throw new NotYourTurnException();
        }

        Square from = Square.fromValue(payload.getFrom().toUpperCase());
        Square to = Square.fromValue(payload.getTo().toUpperCase());
        Piece promotionPiece = payload.getPromotion() != null
                ? Piece.make(sideToMove, pieceTypeFromChar(payload.getPromotion()))
                : Piece.NONE;
        Move candidateMove = new Move(from, to, promotionPiece);

        List<Move> legalMoves = MoveGenerator.generateLegalMoves(board);
        if (!legalMoves.contains(candidateMove)) {
            throw new IllegalMoveException();
        }

        moveList.add(candidateMove);
        String san;
        try {
            String[] sanArray = moveList.toSanArray();
            san = sanArray[sanArray.length - 1];
        } catch (MoveConversionException e) {
            throw new MoveNotationException(e);
        }

        board.doMove(candidateMove);

        Instant now = Instant.now();
        long whiteTimeRemainingMs = game.getWhiteTimeRemainingMs();
        long blackTimeRemainingMs = game.getBlackTimeRemainingMs();
        Instant newDeadlineAt;

        if (sideToMove == Side.WHITE) {
            whiteTimeRemainingMs = updateTimeRemaining(whiteTimeRemainingMs, game, now);
            newDeadlineAt = now.plusMillis(blackTimeRemainingMs);
        } else {
            blackTimeRemainingMs = updateTimeRemaining(blackTimeRemainingMs, game, now);
            newDeadlineAt = now.plusMillis(whiteTimeRemainingMs);
        }

        List<com.chessy.chess_backend.model.Move> updatedMoves =
                computeUpdatedMoves(game, from, to, payload.getPromotion(), san, sideToMove, now);

        String result = null;
        GameResultReason resultReason = null;
        UUID winnerId = null;

        if (board.isMated()) {
            winnerId = sideToMove.flip() == Side.WHITE ? game.getWhitePlayer().getId() : game.getBlackPlayer().getId(); // TODO: N+1?
            result = "checkmate";
            resultReason = GameResultReason.CHECKMATE;
        } else if (board.isStaleMate()) {
            result = "draw";
            resultReason = GameResultReason.STALEMATE;
        } else if (board.isRepetition()) {
            result = "draw";
            resultReason = GameResultReason.THREEFOLD_REPETITION;
        } else if (board.isInsufficientMaterial()) {
            result = "draw";
            resultReason = GameResultReason.INSUFFICIENT_MATERIAL;
        } else if (board.getHalfMoveCounter() >= 100) {
            result = "draw";
            resultReason = GameResultReason.FIFTY_MOVE_RULE;
        }

        boolean isTerminal = resultReason != null;
        Game.GameStatus newStatus = isTerminal ? Game.GameStatus.COMPLETED : Game.GameStatus.IN_PROGRESS;
        Instant finishedAt = isTerminal ? now : null;

        int rows = gameRepository.applyMoveIfCurrent(
                gameId,
                board.getFen(),
                updatedMoves,
                now,
                newDeadlineAt,
                whiteTimeRemainingMs,
                blackTimeRemainingMs,
                newStatus,
                result,
                resultReason != null ? resultReason.toString() : null,
                winnerId,
                finishedAt,
                readMoveVersion
        );

        if (rows == 0) {
            throw new GameConcurrentModificationException(gameId);
        }

        // Write bypassed the persistence context; keep this local object's fields
        // in sync with what was just committed so the mapper/response below reflect
        // the new state. Never call gameRepository.save(game) on this object.
        game.setCurrentFen(board.getFen());
        game.setMoves(updatedMoves);
        game.setLastMoveAt(now);
        game.setCurrentPlayerDeadlineAt(newDeadlineAt);
        game.setWhiteTimeRemainingMs(whiteTimeRemainingMs);
        game.setBlackTimeRemainingMs(blackTimeRemainingMs);
        game.setPendingDrawOfferedBy(null);
        game.setMoveVersion(readMoveVersion + 1);
        game.setDrawVersion(game.getDrawVersion() + 1);

        GameEndResult endResult = null;
        if (isTerminal) {
            game.setStatus(newStatus);
            game.setResult(result);
            game.setResultReason(resultReason.toString());
            game.setWinner(winnerId);
            game.setFinishedAt(finishedAt);
            endResult = publishGameEndResult(gameId, result, resultReason, winnerId, finishedAt);
        } else {
            eventPublisher.publishEvent(new GameDeadlineScheduledEvent(game.getId(), game.getCurrentPlayerDeadlineAt()));
        }

        MoveAppliedEvent event = new MoveAppliedEvent(
                gameId.toString(),
                new MoveAppliedEvent.MoveDetail(payload.getFrom(), payload.getTo(), payload.getPromotion()),
                game.getCurrentFen(),
                whiteTimeRemainingMs,
                blackTimeRemainingMs
        );

        return new GameMoveResult(gameMapper.toDto(game), event, endResult);
    }

    private com.github.bhlangonijr.chesslib.move.Move moveFromEntity(com.chessy.chess_backend.model.Move move) {
        Square from = Square.fromValue(move.getFrom().toUpperCase());
        Square to = Square.fromValue(move.getTo().toUpperCase());

        Piece promotionPiece = Piece.NONE;
        if (move.getPromotion() != null) {
            Side side = "w".equals(move.getColor()) ? Side.WHITE : Side.BLACK;
            promotionPiece = Piece.make(side, pieceTypeFromChar(move.getPromotion()));
        }

        return new com.github.bhlangonijr.chesslib.move.Move(from, to, promotionPiece);
    }

    private PieceType pieceTypeFromChar(String promotion) {
        if (promotion == null) {
            return null;
        }
        switch (promotion.toLowerCase()) {
            case "q":
                return PieceType.QUEEN;
            case "r":
                return PieceType.ROOK;
            case "b":
                return PieceType.BISHOP;
            case "n":
                return PieceType.KNIGHT;
            default:
                throw new IllegalArgumentException("Invalid promotion piece: " + promotion);
        }
    }

    private long updateTimeRemaining(long timeRemaining, Game game, Instant now) {
        Instant lastMoveAt = game.getLastMoveAt();
        long elapsedMs = (lastMoveAt != null) ? Duration.between(lastMoveAt, now).toMillis() : 0L;
        long incrementMs = game.getTimeIncrementSeconds() * 1000L;
        return Math.max(0L, timeRemaining - elapsedMs + incrementMs);
    }

    /**
     * Publishes GameFinishedEvent and builds the GameEndResult for the success
     * (rows-affected == 1) branch of a terminal operation. Must only be called
     * after the corresponding atomic update has already succeeded.
     */
    private GameEndResult publishGameEndResult(UUID gameId, String result, GameResultReason resultReason,
                                               UUID winnerId, Instant finishedAt) {
        eventPublisher.publishEvent(new GameFinishedEvent(gameId));
        return new GameEndResult(gameId, result, resultReason, winnerId, finishedAt);
    }

    private List<com.chessy.chess_backend.model.Move> computeUpdatedMoves(Game game, Square from, Square to,
                                                                          String promotion, String san, Side side,
                                                                          Instant ts) {
        com.chessy.chess_backend.model.Move move = new com.chessy.chess_backend.model.Move(
                from.toString(),
                to.toString(),
                san,
                side == Side.WHITE ? "w" : "b",
                ts.toEpochMilli(),
                promotion
        );
        List<com.chessy.chess_backend.model.Move> updatedMoves = new ArrayList<>(game.getMoves());
        updatedMoves.add(move);
        return updatedMoves;
    }

    @Transactional
    public GameEndResult resignGame(UUID gameId, UUID userId) {
        ParticipantContext ctx = loadActiveParticipant(gameId, userId);
        Game game = ctx.game();
        boolean isWhite = ctx.isWhite();

        UUID winnerId = isWhite ? game.getBlackPlayer().getId() : game.getWhitePlayer().getId();
        String result = isWhite ? "0-1" : "1-0";
        Instant now = Instant.now();

        int rows = gameRepository.resignIfInProgress(gameId, result, GameResultReason.RESIGNATION.toString(), winnerId, now);
        if (rows == 0) {
            throw new GameConcurrentModificationException(gameId);
        }

        return publishGameEndResult(gameId, result, GameResultReason.RESIGNATION, winnerId, now);
    }

    @Transactional
    public GameEndResult abortGame(UUID gameId, UUID userId) {
        ParticipantContext ctx = loadActiveParticipant(gameId, userId);
        Game game = ctx.game();

        if (game.getMoveVersion() >= 2) {
            throw new IllegalGameStateException("Game can no longer be aborted");
        }

        Instant now = Instant.now();
        int rows = gameRepository.abortIfBelowThreshold(gameId, "aborted", GameResultReason.ABORTED.toString(), now, 2);
        if (rows == 0) {
            throw new GameConcurrentModificationException(gameId);
        }
        return publishGameEndResult(gameId, "aborted", GameResultReason.ABORTED, null, now);
    }

    public void validateActiveParticipant(UUID gameId, UUID userId) {
        loadActiveParticipant(gameId, userId);
    }

    @Transactional
    public void offerDraw(UUID gameId, UUID userId) {
        loadActiveParticipant(gameId, userId);

        int rows = gameRepository.offerDrawIfInProgress(gameId, userId);
        if (rows == 0) {
            throw new GameConcurrentModificationException(gameId);
        }
    }

    @Transactional
    public void declineDraw(UUID gameId, UUID userId) {
        ParticipantContext ctx = loadActiveParticipant(gameId, userId);
        Game game = ctx.game();

        int rows = gameRepository.declineDrawIfCurrent(gameId, game.getDrawVersion());
        if (rows == 0) {
            throw new GameConcurrentModificationException(gameId);
        }
    }

    @Transactional
    public GameEndResult acceptDraw(UUID gameId, UUID userId) {
        ParticipantContext ctx = loadActiveParticipant(gameId, userId);
        Game game = ctx.game();

        UUID offeredBy = game.getPendingDrawOfferedBy();
        if (offeredBy == null || offeredBy.equals(userId)) {
            throw new IllegalGameStateException("No draw offer to accept");
        }

        Instant now = Instant.now();
        int rows = gameRepository.acceptDrawIfCurrent(
                gameId, GameResultReason.DRAW_AGREEMENT.toString(), now, game.getDrawVersion());
        if (rows == 0) {
            throw new GameConcurrentModificationException(gameId);
        }

        return publishGameEndResult(gameId, "1/2-1/2", GameResultReason.DRAW_AGREEMENT, null, now);
    }

    /**
     * Scheduler-facing counterpart to the expiry check in loadActiveParticipant.
     * Called by GameTimeoutScheduler when a per-game scheduled task fires, i.e.
     * with no requesting user/action. Returns empty if the game is no longer
     * IN_PROGRESS, hasn't actually expired, or lost the CAS race (e.g. a later
     * move landed and pushed moveVersion forward before this task ran).
     */
    @Transactional
    public Optional<GameEndResult> timeoutIfExpired(UUID gameId) {
        Game game = gameRepository.findById(gameId).orElse(null);
        if (game == null || game.getStatus() != Game.GameStatus.IN_PROGRESS || !isExpired(game)) {
            return Optional.empty();
        }
        return timeoutGame(game);
    }

    private record ParticipantContext(Game game, boolean isWhite, boolean isBlack) {
    }

    private ParticipantContext loadActiveParticipant(UUID gameId, UUID userId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException(gameId));

        if (game.getStatus() != Game.GameStatus.IN_PROGRESS) {
            throw new IllegalGameStateException("Game is not in progress");
        }

        if (isExpired(game)) {
            Optional<GameEndResult> endResult = timeoutGame(game);
            if (endResult.isPresent()) {
                throw new GameTimedOutException(endResult.get());
            }
            throw new GameConcurrentModificationException(gameId);
        }

        boolean isWhite = game.getWhitePlayer() != null && userId.equals(game.getWhitePlayer().getId());
        boolean isBlack = game.getBlackPlayer() != null && userId.equals(game.getBlackPlayer().getId());
        if (!isWhite && !isBlack) {
            throw new NotAParticipantException();
        }

        return new ParticipantContext(game, isWhite, isBlack);
    }

    private boolean isExpired(Game game) {
        Instant deadline = game.getCurrentPlayerDeadlineAt();
        return deadline != null && Instant.now().isAfter(deadline);
    }

    private Optional<GameEndResult> timeoutGame(Game game) {
        boolean whiteToMove = game.getMoves().size() % 2 == 0;
        UUID winnerId = whiteToMove ? game.getBlackPlayer().getId() : game.getWhitePlayer().getId();
        String result = whiteToMove ? "0-1" : "1-0";
        Instant now = Instant.now();

        int rows = gameRepository.timeoutIfCurrent(
                game.getId(), result, GameResultReason.TIMEOUT.toString(), winnerId, now,
                game.getMoveVersion(), whiteToMove);

        if (rows == 0) {
            return Optional.empty();
        }

        return Optional.of(publishGameEndResult(game.getId(), result, GameResultReason.TIMEOUT, winnerId, now));
    }

}