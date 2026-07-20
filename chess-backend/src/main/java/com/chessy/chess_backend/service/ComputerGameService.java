package com.chessy.chess_backend.service;

import com.chessy.chess_backend.controller.socketio.computerGame.payload.ComputerGameMovePayload;
import com.chessy.chess_backend.dto.gameGeneral.MoveDto;
import com.chessy.chess_backend.dto.computerGame.ComputerGameDto;
import com.chessy.chess_backend.dto.computerGame.ComputerGameEndResult;
import com.chessy.chess_backend.dto.computerGame.ComputerGameMoveResult;
import com.chessy.chess_backend.model.enums.computerGame.ComputerGameWinner;
import com.chessy.chess_backend.model.enums.computerGame.Difficulty;
import com.chessy.chess_backend.model.enums.computerGame.MoveSource;
import com.chessy.chess_backend.model.enums.computerGame.UserColor;
import com.chessy.chess_backend.model.enums.gameGeneral.GameResultReason;
import com.chessy.chess_backend.entity.ComputerGame;
import com.chessy.chess_backend.entity.User;
import com.chessy.chess_backend.event.computerGame.BotMoveRequestedEvent;
import com.chessy.chess_backend.event.computerGame.ComputerGameDeadlineScheduledEvent;
import com.chessy.chess_backend.event.computerGame.ComputerGameFinishedEvent;
import com.chessy.chess_backend.controller.socketio.computerGame.event.ComputerGameMoveAppliedEvent;
import com.chessy.chess_backend.exception.*;
import com.chessy.chess_backend.model.enums.gameGeneral.GameStatus;
import com.chessy.chess_backend.repository.ComputerGameRepository;
import com.github.bhlangonijr.chesslib.*;
import com.github.bhlangonijr.chesslib.move.Move;
import com.github.bhlangonijr.chesslib.move.MoveConversionException;
import com.github.bhlangonijr.chesslib.move.MoveGenerator;
import com.github.bhlangonijr.chesslib.move.MoveList;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chessy.chess_backend.exception.ComputerGameTimedOutException;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ComputerGameService {

    // Abort is only allowed before the bot's opening reply has landed
    // (moveVersion 0 = no moves yet, 1 = one move made).
    private static final int ABORT_MOVE_VERSION_THRESHOLD = 2;

    private final ComputerGameRepository computerGameRepository;
    private final EntityManager entityManager;
    private final ApplicationEventPublisher eventPublisher;
    private final Random random = new Random();

    /**
     * colorPreference: "WHITE", "BLACK", or "RANDOM". RANDOM is resolved
     * here, once, before the row is built — the persisted user_color is
     * always a concrete WHITE/BLACK value, never RANDOM itself.
     */

    @Transactional(readOnly = true)
    public ComputerGameDto getGame(UUID gameId){
        return toDto(computerGameRepository.findByIdWithUser(gameId)
                .orElseThrow(() -> new GameNotFoundException(gameId)));
    }

    @Transactional(readOnly = true)
    public Optional<ComputerGameDto> getActiveGame(UUID userId) {
        return computerGameRepository.findByUser_IdAndStatus(userId, GameStatus.IN_PROGRESS)
                .stream()
                .findFirst()
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public ComputerGameDto getGameForUser(UUID gameId, UUID userId) {
        ComputerGame game = computerGameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException(gameId));
        if (!userId.equals(game.getUser().getId())) {
            throw new NotAParticipantException();
        }
        return toDto(game);
    }
    @Transactional
    public ComputerGameDto createOrGetGame(UUID userId, Difficulty difficulty, String engine,
                                           boolean isTimed, Integer timeInitialSeconds, Integer timeIncrementSeconds,
                                           String colorPreference) {

        List<ComputerGame> inProgressGames = computerGameRepository
                .findByUser_IdAndStatus(userId, GameStatus.IN_PROGRESS);

        if (!inProgressGames.isEmpty()) {
            return toDto(inProgressGames.getFirst());
        }

        UserColor userColor = resolveUserColor(colorPreference);
        long timeLimitMs = isTimed ? timeInitialSeconds * 1000L : 0L;

        int gracePeriodSeconds = 2;
        Instant now = Instant.now();
        Instant clockStartsAt = isTimed ? now.plus(gracePeriodSeconds, ChronoUnit.SECONDS) : null;

        ComputerGame game = new ComputerGame();
        game.setUser(entityManager.getReference(User.class, userId));
        game.setUserColor(userColor);
        game.setDifficulty(difficulty);
        game.setEngine(engine);
        game.setTimed(isTimed);
        game.setTimeInitialSeconds(isTimed ? timeInitialSeconds : null);
        game.setTimeIncrementSeconds(isTimed ? timeIncrementSeconds : null);
        game.setWhiteTimeRemainingMs(isTimed ? timeLimitMs : null);
        game.setBlackTimeRemainingMs(isTimed ? timeLimitMs : null);
        game.setLastMoveAt(clockStartsAt);
        game.setCurrentPlayerDeadlineAt(isTimed ? clockStartsAt.plus(timeInitialSeconds, ChronoUnit.SECONDS) : null);

        System.out.println(String.valueOf(timeLimitMs));
        ComputerGame saved = computerGameRepository.save(game);


        if (isTimed) {
            eventPublisher.publishEvent(new ComputerGameDeadlineScheduledEvent(saved.getId(), saved.getCurrentPlayerDeadlineAt()));
        }

        if (userColor == UserColor.BLACK) {
            System.out.println("bot move requested on game start");
            eventPublisher.publishEvent(new BotMoveRequestedEvent(saved.getId()));
        }

        return toDto(saved);
    }

    private UserColor resolveUserColor(String colorPreference) {
        if (colorPreference == null || colorPreference.equalsIgnoreCase("RANDOM")) {
            return random.nextBoolean() ? UserColor.WHITE : UserColor.BLACK;
        }

        return switch (colorPreference.toUpperCase()) {
            case "WHITE" -> UserColor.WHITE;
            case "BLACK" -> UserColor.BLACK;
            default -> throw new IllegalArgumentException(
                    "Invalid color preference: " + colorPreference);
        };
    }

    /**
     * Applies the user's move, persists it, and notifies immediately. The
     * bot's reply is NOT computed here — publishing BotMoveRequestedEvent
     * (after-commit) hands that off to a separate listener, so this method
     * stays fast and never blocks on the engine.
     */
    @Transactional
    public ComputerGameMoveResult applyMove(UUID gameId, UUID userId, ComputerGameMovePayload payload, MoveSource source) {
        ComputerGame game = loadActiveGame(gameId, userId);
        int readMoveVersion = game.getMoveVersion();

        Board board = reconstructBoard(game);
        MoveList moveList = new MoveList();
        moveList.addAll(game.getMoves().stream().map(this::moveFromEntity).toList());

        Side sideToMove = board.getSideToMove();
        boolean isUserColorToMove = (sideToMove == Side.WHITE && game.getUserColor() == UserColor.WHITE)
                || (sideToMove == Side.BLACK && game.getUserColor() == UserColor.BLACK);

        boolean isCorrectMover = (source == MoveSource.USER) == isUserColorToMove;

        if (!isCorrectMover) {
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

        List<com.chessy.chess_backend.model.Move> updatedMoves = new ArrayList<>(game.getMoves());
        updatedMoves.add(new com.chessy.chess_backend.model.Move(
                from.toString(), to.toString(), san,
                sideToMove == Side.WHITE ? "w" : "b",
                now.toEpochMilli(), payload.getPromotion()
        ));

        boolean isTerminal = board.isMated() || board.isStaleMate() || board.isRepetition()
                || board.isInsufficientMaterial() || board.getHalfMoveCounter() >= 100;
        String result = null;
        GameResultReason resultReason = null;
        ComputerGameWinner winner = null;
        if (board.isMated()) {
            result = sideToMove == Side.WHITE ? "1-0" : "0-1";
            resultReason = GameResultReason.CHECKMATE;
            winner = sideToMove == toSide(game.getUserColor()) ? ComputerGameWinner.USER : ComputerGameWinner.COMPUTER;
        } else if (isTerminal) {
            result = "1/2-1/2";
            resultReason = board.isStaleMate() ? GameResultReason.STALEMATE
                    : board.isRepetition() ? GameResultReason.THREEFOLD_REPETITION
                      : board.isInsufficientMaterial() ? GameResultReason.INSUFFICIENT_MATERIAL
                        : GameResultReason.FIFTY_MOVE_RULE;
            winner = ComputerGameWinner.DRAW;
        }
        GameStatus newStatus = isTerminal ? GameStatus.COMPLETED : GameStatus.IN_PROGRESS;
        Instant finishedAt = isTerminal ? now : null;

        Long whiteTimeRemainingMs = game.getWhiteTimeRemainingMs();
        Long blackTimeRemainingMs = game.getBlackTimeRemainingMs();
        Instant newDeadline = null;
        if (game.isTimed()) {
            long elapsedMs = game.getLastMoveAt() != null
                    ? Duration.between(game.getLastMoveAt(), now).toMillis() : 0L;
            long incrementMs = game.getTimeIncrementSeconds() * 1000L;
            if (sideToMove == Side.WHITE) {
                whiteTimeRemainingMs = Math.max(0L, whiteTimeRemainingMs - elapsedMs + incrementMs);
                newDeadline = now.plusMillis(blackTimeRemainingMs);
            } else {
                blackTimeRemainingMs = Math.max(0L, blackTimeRemainingMs - elapsedMs + incrementMs);
                newDeadline = now.plusMillis(whiteTimeRemainingMs);
            }
        }

        int rows = computerGameRepository.applyMoveIfCurrent(
                gameId, board.getFen(), updatedMoves, now, newDeadline,
                whiteTimeRemainingMs, blackTimeRemainingMs, newStatus, result, resultReason,
                finishedAt, readMoveVersion
        );
        if (rows == 0) {
            throw new GameConcurrentModificationException(gameId);
        }

        game.setCurrentFen(board.getFen());
        game.setMoves(updatedMoves);
        game.setLastMoveAt(now);
        game.setCurrentPlayerDeadlineAt(newDeadline);
        game.setWhiteTimeRemainingMs(whiteTimeRemainingMs);
        game.setBlackTimeRemainingMs(blackTimeRemainingMs);
        game.setStatus(newStatus);
        game.setResult(result);
        game.setResultReason(resultReason);
        game.setFinishedAt(finishedAt);
        game.setMoveVersion(readMoveVersion + 1);

        ComputerGameMoveAppliedEvent moveAppliedEvent = new ComputerGameMoveAppliedEvent(
                gameId.toString(),
                new ComputerGameMoveAppliedEvent.MoveDetail(payload.getFrom(), payload.getTo(), payload.getPromotion(), san),
                game.getCurrentFen(),
                whiteTimeRemainingMs,
                blackTimeRemainingMs
        );
        ComputerGameEndResult endResult = null;
        if (isTerminal) {
            endResult = new ComputerGameEndResult(gameId, result, resultReason, winner, finishedAt, userId);
            eventPublisher.publishEvent(new ComputerGameFinishedEvent(gameId));
        } else {
            if (source == MoveSource.USER) {
                eventPublisher.publishEvent(new BotMoveRequestedEvent(gameId));
            }
            if (game.isTimed()) {
                eventPublisher.publishEvent(new ComputerGameDeadlineScheduledEvent(gameId, newDeadline));
            }
        }

        return new ComputerGameMoveResult(toDto(game), moveAppliedEvent, endResult);
    }

    @Transactional
    public ComputerGameEndResult resignGame(UUID gameId, UUID userId) {
        ComputerGame game = loadActiveGame(gameId, userId);
        Instant now = Instant.now();

        String result = game.getUserColor() == UserColor.WHITE ? "0-1" : "1-0";
        GameResultReason resultReason = GameResultReason.RESIGNATION;

        int rows = computerGameRepository.resignIfInProgress(gameId, result, resultReason, now);
        if (rows == 0) {
            throw new GameConcurrentModificationException(gameId);
        }

        eventPublisher.publishEvent(new ComputerGameFinishedEvent(gameId));

        // The resigning party is always the user, so the computer wins.
        return new ComputerGameEndResult(gameId, result, resultReason, ComputerGameWinner.COMPUTER, now, userId);
    }

    @Transactional
    public ComputerGameEndResult abortGame(UUID gameId, UUID userId) {
        ComputerGame game = loadActiveGame(gameId, userId);
        if (game.getMoveVersion() >= ABORT_MOVE_VERSION_THRESHOLD) {
            throw new IllegalGameStateException("Game can no longer be aborted");
        }

        Instant now = Instant.now();
        String result = "aborted";
        GameResultReason resultReason = GameResultReason.ABORTED;

        int rows = computerGameRepository.abortIfBelowThreshold(gameId, result, resultReason, now, ABORT_MOVE_VERSION_THRESHOLD);
        if (rows == 0) {
            throw new GameConcurrentModificationException(gameId);
        }

        eventPublisher.publishEvent(new ComputerGameFinishedEvent(gameId));

        return new ComputerGameEndResult(gameId, result, resultReason, ComputerGameWinner.DRAW, now, userId);
    }

    private ComputerGame loadActiveGame(UUID gameId, UUID userId) {
        ComputerGame game = computerGameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException(gameId));

        if (!userId.equals(game.getUser().getId())) {
            throw new NotAParticipantException();
        }
        if (game.getStatus() != GameStatus.IN_PROGRESS) {
            throw new IllegalGameStateException("Game is not in progress");
        }

        if (isExpired(game)) {
            Optional<ComputerGameEndResult> endResult = timeoutGame(game);
            if (endResult.isPresent()) {
                throw new ComputerGameTimedOutException(endResult.get());
            }
            throw new GameConcurrentModificationException(gameId);
        }

        return game;
    }

    private boolean isExpired(ComputerGame game) {
        if (!game.isTimed()) return false;
        Instant deadline = game.getCurrentPlayerDeadlineAt();
        return deadline != null && Instant.now().isAfter(deadline);
    }

    private Board reconstructBoard(ComputerGame game) {
        Board board = new Board();
        for (Move historyMove : game.getMoves().stream().map(this::moveFromEntity).toList()) {
            board.doMove(historyMove);
        }
        return board;
    }

    private Side toSide(UserColor userColor) {
        return userColor == UserColor.WHITE ? Side.WHITE : Side.BLACK;
    }

    private ComputerGameDto toDto(ComputerGame game) {
        return ComputerGameDto.builder()
                .id(game.getId())
                .userId(game.getUser().getId())
                .userColor(UserColor.valueOf(game.getUserColor().name()))
                .status(game.getStatus())
                .currentFen(game.getCurrentFen())
                .moves(game.getMoves().stream().map(this::toMoveDto).toList())
                .difficulty(Difficulty.valueOf(game.getDifficulty().name()))
                .engine(game.getEngine())
                .result(game.getResult())
                .resultReason(game.getResultReason() != null ? game.getResultReason().name() : null)
                .isTimed(game.isTimed())
                .timeInitialSeconds(game.getTimeInitialSeconds())
                .timeIncrementSeconds(game.getTimeIncrementSeconds())
                .whiteTimeRemainingMs(game.getWhiteTimeRemainingMs())
                .blackTimeRemainingMs(game.getBlackTimeRemainingMs())
                .lastMoveAt(game.getLastMoveAt())
                .currentPlayerDeadlineAt(game.getCurrentPlayerDeadlineAt())
                .createdAt(game.getCreatedAt())
                .finishedAt(game.getFinishedAt())
                .build();
    }

    // ASSUMPTION: MoveDto mirrors com.chessy.chess_backend.model.Move's fields
    // exactly (from, to, san, color, timestamp, promotion). Unconfirmed — see chat.
    private MoveDto toMoveDto(com.chessy.chess_backend.model.Move move) {
        return new MoveDto(move.getFrom(), move.getTo(), move.getSan(), move.getColor(), move.getTs(),  move.getPromotion());
    }


    private Move moveFromEntity(com.chessy.chess_backend.model.Move move) {
        Square from = Square.fromValue(move.getFrom().toUpperCase());
        Square to = Square.fromValue(move.getTo().toUpperCase());
        Piece promotionPiece = Piece.NONE;
        if (move.getPromotion() != null) {
            Side side = "w".equals(move.getColor()) ? Side.WHITE : Side.BLACK;
            promotionPiece = Piece.make(side, pieceTypeFromChar(move.getPromotion()));
        }
        return new Move(from, to, promotionPiece);
    }

    private PieceType pieceTypeFromChar(String promotion) {
        if (promotion == null) return null;
        return switch (promotion.toLowerCase()) {
            case "q" -> PieceType.QUEEN;
            case "r" -> PieceType.ROOK;
            case "b" -> PieceType.BISHOP;
            case "n" -> PieceType.KNIGHT;
            default -> throw new IllegalArgumentException("Invalid promotion piece: " + promotion);
        };
    }

    private Optional<ComputerGameEndResult> timeoutGame(ComputerGame game) {

        org.hibernate.Hibernate.initialize(game.getUser());

        boolean whiteToMove = game.getMoves().size() % 2 == 0;
        Side sideToMove = whiteToMove ? Side.WHITE : Side.BLACK;
        String result = whiteToMove ? "0-1" : "1-0";
        ComputerGameWinner winner = sideToMove == toSide(game.getUserColor())
                ? ComputerGameWinner.COMPUTER
                : ComputerGameWinner.USER;
        Instant now = Instant.now();

        int rows = computerGameRepository.timeoutIfCurrent(
                game.getId(), result, GameResultReason.TIMEOUT, now, game.getMoveVersion(), whiteToMove);

        if (rows == 0) {
            return Optional.empty();
        }

        eventPublisher.publishEvent(new ComputerGameFinishedEvent(game.getId()));
        return Optional.of(new ComputerGameEndResult(
                game.getId(), result, GameResultReason.TIMEOUT, winner, now, game.getUser().getId()));
    }

    /**
     * Scheduler-facing counterpart to the expiry check in loadActiveGame.
     * Returns empty if the game is no longer IN_PROGRESS, hasn't actually
     * expired, or lost the CAS race.
     */
    @Transactional
    public Optional<ComputerGameEndResult> timeoutIfExpired(UUID gameId) {
        ComputerGame game = computerGameRepository.findById(gameId).orElse(null);
        if (game == null || game.getStatus() != GameStatus.IN_PROGRESS || !isExpired(game)) {
            return Optional.empty();
        }
        return timeoutGame(game);
    }

}