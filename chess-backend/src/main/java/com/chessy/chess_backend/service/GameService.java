package com.chessy.chess_backend.service;

import com.chessy.chess_backend.controller.socketio.game.event.MoveAppliedEvent;
import com.chessy.chess_backend.controller.socketio.game.payload.MovePayload;
import com.chessy.chess_backend.dto.*;
import com.chessy.chess_backend.entity.Game;
import com.chessy.chess_backend.exception.*;
import com.chessy.chess_backend.mapper.GameMapper;
import com.chessy.chess_backend.mapper.MoveMapper;
import com.chessy.chess_backend.repository.GameRepository;
import com.chessy.chess_backend.repository.UserRepository;
import com.github.bhlangonijr.chesslib.move.MoveGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.bhlangonijr.chesslib.*;
import com.github.bhlangonijr.chesslib.move.Move;
import com.github.bhlangonijr.chesslib.move.MoveConversionException;
import com.github.bhlangonijr.chesslib.move.MoveList;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GameService {

    private final GameRepository gameRepository;
    private final GameMapper gameMapper;
    private final MoveMapper moveMapper;
    private final UserRepository userRepository;

    public CreateGameResponseDto createGame(UUID whitePlayerId, UUID blackPlayerId) {
        Game game = Game.builder()
                .whitePlayer(userRepository.getById(whitePlayerId))
                .blackPlayer(userRepository.getById(blackPlayerId))
                .status(Game.GameStatus.IN_PROGRESS)
                .currentFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
                .moves(new ArrayList<>())
                .timeInitialSeconds(600)
                .timeIncrementSeconds(0)
                .whiteTimeRemainingMs(600_000L)
                .blackTimeRemainingMs(600_000L)
                .build();

        Game saved = gameRepository.save(game);

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

        Board board = new Board();
//        MoveList moveList = new MoveList();
        for (Move historyMove : game.getMoves().stream().map(this::moveFromEntity).toList()) {
            board.doMove(historyMove);
//            moveList.add(historyMove);
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

        MoveList moveList = new MoveList(board.getFen());
        moveList.add(candidateMove); // movelist only contains last two states
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

        appendMove(game, from, to, payload.getPromotion(), san, sideToMove, now);
        game.setCurrentFen(board.getFen());
        game.setLastMoveAt(now);
        game.setCurrentPlayerDeadlineAt(newDeadlineAt);
        game.setWhiteTimeRemainingMs(whiteTimeRemainingMs);
        game.setBlackTimeRemainingMs(blackTimeRemainingMs);

        GameEndResult endResult = null;
        if (board.isMated()) {
            UUID winnerId = sideToMove.flip() == Side.WHITE ? game.getWhitePlayer().getId() : game.getBlackPlayer().getId(); // TODO: N+1?
            endResult = endGame(game, "checkmate", winnerId, GameResultReason.CHECKMATE);
        } else if (board.isStaleMate()) {
            endResult = endGame(game, "draw", null, GameResultReason.STALEMATE);
        } else if (board.isRepetition()) {
            endResult = endGame(game, "draw", null, GameResultReason.THREEFOLD_REPETITION);
        } else if (board.isInsufficientMaterial()) {
            endResult = endGame(game, "draw", null, GameResultReason.INSUFFICIENT_MATERIAL);
        } else if (board.getHalfMoveCounter() >= 100) {
            endResult = endGame(game, "draw", null, GameResultReason.FIFTY_MOVE_RULE);
        } else {
            game = gameRepository.save(game);
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

    public GameEndResult endGame(Game game, String result, UUID winnerId, GameResultReason resultReason) {
        Instant now = Instant.now();
        game.setStatus(Game.GameStatus.COMPLETED);
        game.setResult(result);
        game.setResultReason(resultReason.toString());
        game.setWinner(winnerId);
        game.setFinishedAt(now);

        game = gameRepository.save(game);

        return new GameEndResult(game.getId(), result, resultReason, winnerId, now);
    }

    private void appendMove(Game game, Square from, Square to, String promotion, String san, Side side, Instant ts) {
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
        game.setMoves(updatedMoves);
    }

    @Transactional
    public GameEndResult resignGame(UUID gameId, UUID userId) {
        ParticipantContext ctx = loadActiveParticipant(gameId, userId);
        Game game = ctx.game();
        boolean isWhite = ctx.isWhite();

        UUID winnerId = isWhite ? game.getBlackPlayer().getId() : game.getWhitePlayer().getId();
        String result = isWhite ? "0-1" : "1-0";

        return endGame(game, result, winnerId, GameResultReason.RESIGNATION);
    }

    @Transactional
    public GameEndResult abortGame(UUID gameId, UUID userId) {
        ParticipantContext ctx = loadActiveParticipant(gameId, userId);
        Game game = ctx.game();

        if (game.getMoves().size() >= 2) {
            throw new IllegalGameStateException("Game can no longer be aborted");
        }

        Instant now = Instant.now();
        game.setStatus(Game.GameStatus.ABORTED);
        game.setResult("aborted");
        game.setResultReason("abort");
        game.setWinner(null);
        game.setFinishedAt(now);

        game = gameRepository.save(game);

        return new GameEndResult(game.getId(), "aborted", GameResultReason.ABORTED, null, now);
    }

    public void validateActiveParticipant(UUID gameId, UUID userId) {
        loadActiveParticipant(gameId, userId);
    }

    @Transactional
    public void offerDraw(UUID gameId, UUID userId) {
        ParticipantContext ctx = loadActiveParticipant(gameId, userId);
        Game game = ctx.game();
        game.setPendingDrawOfferedBy(userId);
        gameRepository.save(game);
    }

    @Transactional
    public void declineDraw(UUID gameId, UUID userId) {
        ParticipantContext ctx = loadActiveParticipant(gameId, userId);
        Game game = ctx.game();
        game.setPendingDrawOfferedBy(null);
        gameRepository.save(game);
    }

    @Transactional
    public GameEndResult acceptDraw(UUID gameId, UUID userId) {
        ParticipantContext ctx = loadActiveParticipant(gameId, userId);
        Game game = ctx.game();

        UUID offeredBy = game.getPendingDrawOfferedBy();
        if (offeredBy == null || offeredBy.equals(userId)) {
            throw new IllegalGameStateException("No draw offer to accept");
        }

        game.setPendingDrawOfferedBy(null);
        return endGame(game, "1/2-1/2", null, GameResultReason.DRAW_AGREEMENT);
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
            GameEndResult endResult = timeoutGame(game);
            throw new GameTimedOutException(endResult);
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

    private GameEndResult timeoutGame(Game game) {
        boolean whiteToMove = game.getMoves().size() % 2 == 0;
        UUID winnerId = whiteToMove ? game.getBlackPlayer().getId() : game.getWhitePlayer().getId();
        String result = whiteToMove ? "0-1" : "1-0";
        return endGame(game, result, winnerId, GameResultReason.TIMEOUT);
    }

}