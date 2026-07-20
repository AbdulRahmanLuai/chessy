package com.chessy.chess_backend.controller.socketio.computerGame.engine;

import com.chessy.chess_backend.controller.socketio.computerGame.ChessEngine;
import com.chessy.chess_backend.controller.socketio.computerGame.payload.ComputerGameMovePayload;
import com.chessy.chess_backend.dto.gameGeneral.MoveDto;
import com.chessy.chess_backend.model.enums.computerGame.Difficulty;
import com.chessy.chess_backend.model.enums.computerGame.EngineType;
import com.github.bhlangonijr.chesslib.Board;
import com.github.bhlangonijr.chesslib.Piece;
import com.github.bhlangonijr.chesslib.move.MoveGenerator;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.List;
import java.util.Random;

/**
 * Picks uniformly at random among all legal moves for the current position.
 * Ignores difficulty entirely — useful as a baseline/"easiest" opponent and
 * as a fallback if a smarter engine fails.
 */
@Component
public class RandomEngine implements ChessEngine {

    private final Random random = new SecureRandom();

    @Override
    public EngineType getType() {
        return EngineType.RANDOM;
    }

    @Override
    public ComputerGameMovePayload computeMove(String fen, List<MoveDto> moveHistory, Difficulty difficulty) {
        Board board = new Board();
        board.loadFromFen(fen);

        List<com.github.bhlangonijr.chesslib.move.Move> legalMoves = MoveGenerator.generateLegalMoves(board);
        if (legalMoves.isEmpty()) {
            // Shouldn't happen if the listener's inProgress/isBotMove checks are correct
            // (a game with no legal moves should already be terminal), but guard anyway.
            throw new IllegalStateException("No legal moves available for position: " + fen);
        }

        com.github.bhlangonijr.chesslib.move.Move chosen = legalMoves.get(random.nextInt(legalMoves.size()));

        String promotion = null;
        Piece promotedTo = chosen.getPromotion();
        if (promotedTo != null && promotedTo != Piece.NONE) {
            promotion = pieceTypeChar(promotedTo);
        }

        return new ComputerGameMovePayload(
                null,
                chosen.getFrom().toString(),
                chosen.getTo().toString(),
                promotion
        );
    }

    private String pieceTypeChar(Piece piece) {
        // chesslib Piece enum is e.g. WHITE_QUEEN/BLACK_QUEEN; map to a bare
        // promotion letter (q/r/b/n) the same way payload.getPromotion() is
        // consumed elsewhere (payload.getPromotion() -> pieceTypeFromChar in applyMove).
        return switch (piece.getPieceType()) {
            case QUEEN -> "q";
            case ROOK -> "r";
            case BISHOP -> "b";
            case KNIGHT -> "n";
            default -> throw new IllegalStateException("Unexpected promotion piece: " + piece);
        };
    }
}