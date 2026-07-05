import { useState, useMemo, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import type { Square, Color, PieceSymbol } from '@/types';
import styles from './Board.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────

// Sacred board colors — match --board-light and --board-dark tokens exactly.
// These must be hex values (not CSS vars) because react-chessboard takes JS objects.
const BOARD_LIGHT  = '#F0D9B5';
const BOARD_DARK   = '#B58863';

const PROMOTION_PIECES: PieceSymbol[] = ['q', 'r', 'b', 'n'];

const PROMOTION_GLYPHS: Record<Color, Record<string, string>> = {
  white: { q: '♕', r: '♖', b: '♗', n: '♘' },
  black: { q: '♛', r: '♜', b: '♝', n: '♞' },
};

// ─── Highlight styles (JS objects for react-chessboard customSquareStyles) ───

const SQ_LAST_MOVE = {
  backgroundColor: 'rgba(20, 85, 30, 0.4)',
} as const;

const SQ_SELECTED = {
  backgroundColor: 'rgba(20, 85, 30, 0.7)',
} as const;

const SQ_VALID_MOVE = {
  backgroundImage:
    'radial-gradient(circle, rgba(0,0,0,0.22) 28%, transparent 28%)',
} as const;

const SQ_VALID_CAPTURE = {
  backgroundImage:
    'radial-gradient(circle, transparent 58%, rgba(0,0,0,0.22) 58%)',
} as const;

const SQ_CHECK = {
  backgroundColor: 'rgba(220, 50, 50, 0.65)',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extracts the rank number from a square string (e.g. 'e8' → 8) */
function rankOf(square: Square): number {
  return parseInt(square[1], 10);
}

/** Returns true if moving a pawn to this square would require promotion */
function isPromotionMove(piece: string, to: Square): boolean {
  const isPawn = piece[1]?.toLowerCase() === 'p';
  const rank   = rankOf(to);
  return isPawn && (rank === 8 || rank === 1);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BoardProps {
  /** Current board position as a FEN string */
  fen: string;
  /** Which color appears at the bottom of the board */
  orientation: Color;
  /**
   * Called when the user attempts a move.
   * Parent validates the move and returns true if accepted, false if rejected.
   * Returning false causes the piece to snap back.
   */
  onMoveAttempt: (from: Square, to: Square, promotion?: PieceSymbol) => boolean;
  /** Squares of the last played move to highlight */
  lastMove?: { from: Square; to: Square } | null;
  /** Square of the king currently in check */
  checkSquare?: Square | null;
  /** When true the board renders but ignores all interaction */
  disabled?: boolean;
  className?: string;
}

interface PendingPromotion {
  from: Square;
  to: Square;
  /** Color of the pawn being promoted, determines which glyphs to show */
  color: Color;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Board({
  fen,
  orientation,
  onMoveAttempt,
  lastMove,
  checkSquare,
  disabled = false,
  className,
}: BoardProps) {
  const [selectedSquare,  setSelectedSquare]  = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

  // ── Chess instance (display logic only — not game state) ──────────────────

  const chess = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      // Fallback to starting position if FEN is malformed
      return new Chess();
    }
  }, [fen]);

  // ── Legal destinations from the selected square ───────────────────────────

  const legalDestinations = useMemo<Set<Square>>(() => {
    if (!selectedSquare) return new Set();
    const moves = chess.moves({ square: selectedSquare, verbose: true });
    return new Set(moves.map((m) => m.to as Square));
  }, [chess, selectedSquare]);

  // ── Custom square styles ──────────────────────────────────────────────────

  const customSquareStyles = useMemo(() => {
    const sq: Record<string, React.CSSProperties> = {};

    if (lastMove) {
      sq[lastMove.from] = SQ_LAST_MOVE;
      sq[lastMove.to]   = SQ_LAST_MOVE;
    }

    if (checkSquare) {
      sq[checkSquare] = SQ_CHECK;
    }

    if (selectedSquare) {
      sq[selectedSquare] = SQ_SELECTED;

      legalDestinations.forEach((dest) => {
        const occupied = chess.get(dest);
        // Show a ring on squares with opponent pieces, dot on empty squares
        sq[dest] = occupied ? SQ_VALID_CAPTURE : SQ_VALID_MOVE;
      });
    }

    return sq;
  }, [lastMove, checkSquare, selectedSquare, legalDestinations, chess]);

  // ── Attempt a move (shared by click and drag) ─────────────────────────────

  const attemptMove = useCallback(
    (from: Square, to: Square, piece: string): boolean => {
      if (disabled) return false;

      if (isPromotionMove(piece, to)) {
        // Determine the color of the pawn from the piece string ('wP' → white)
        const color: Color = piece[0] === 'w' ? 'white' : 'black';
        setPendingPromotion({ from, to, color });
        setSelectedSquare(null);
        // Return false so the dragged piece snaps back while picker is shown
        return false;
      }

      const accepted = onMoveAttempt(from, to);
      if (accepted) setSelectedSquare(null);
      return accepted;
    },
    [disabled, onMoveAttempt],
  );

  // ── Drag handler ──────────────────────────────────────────────────────────

  const handlePieceDrop = useCallback(
    (source: string, target: string, piece: string): boolean => {
      return attemptMove(source as Square, target as Square, piece);
    },
    [attemptMove],
  );

  // ── Click-to-move handler ─────────────────────────────────────────────────

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (disabled) return;

      const activeColor = chess.turn() === 'w' ? 'white' : 'black';

      // Nothing selected yet
      if (!selectedSquare) {
        const piece = chess.get(square);
        // Only select if there's a piece of the active color on this square
        if (piece && piece.color === chess.turn()) {
          setSelectedSquare(square);
        }
        return;
      }

      // Clicking the already-selected square → deselect
      if (square === selectedSquare) {
        setSelectedSquare(null);
        return;
      }

      // Clicking another piece of the same color → switch selection
      const target = chess.get(square);
      if (target && target.color === chess.turn()) {
        setSelectedSquare(square);
        return;
      }

      // Attempt the move
      // Build a pseudo piece string matching the drag format ('wP', 'bN', etc.)
      const movingPiece = chess.get(selectedSquare);
      if (!movingPiece) {
        setSelectedSquare(null);
        return;
      }

      const pieceStr = `${activeColor === 'white' ? 'w' : 'b'}${movingPiece.type.toUpperCase()}`;
      attemptMove(selectedSquare, square, pieceStr);
    },
    [disabled, chess, selectedSquare, attemptMove],
  );

  // ── Promotion picker ──────────────────────────────────────────────────────

  function handlePromotionSelect(piece: PieceSymbol) {
    if (!pendingPromotion) return;
    onMoveAttempt(pendingPromotion.from, pendingPromotion.to, piece);
    setPendingPromotion(null);
  }

  function handlePromotionCancel() {
    setPendingPromotion(null);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      <Chessboard
        position={fen}
        boardOrientation={orientation}
        onPieceDrop={handlePieceDrop}
        onSquareClick={handleSquareClick}
        customSquareStyles={customSquareStyles}
        arePiecesDraggable={!disabled}
        customLightSquareStyle={{ backgroundColor: BOARD_LIGHT }}
        customDarkSquareStyle={{ backgroundColor: BOARD_DARK }}
        customBoardStyle={{
          borderRadius: '4px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        }}
        animationDuration={120}
        areArrowsAllowed={!disabled}
      />

      {/* ── Promotion picker overlay ──────────────────────────────────────── */}
      {pendingPromotion && (
        <div
          className={styles.promotionOverlay}
          role="dialog"
          aria-label="Choose promotion piece"
          aria-modal="true"
        >
          <div className={styles.promotionCard}>
            <p className={styles.promotionLabel}>Promote to</p>
            <div className={styles.promotionPieces}>
              {PROMOTION_PIECES.map((piece) => (
                <button
                  key={piece}
                  className={styles.promotionPieceBtn}
                  onClick={() => handlePromotionSelect(piece)}
                  aria-label={`Promote to ${piece}`}
                >
                  {PROMOTION_GLYPHS[pendingPromotion.color][piece]}
                </button>
              ))}
            </div>
            <button
              className={styles.promotionCancel}
              onClick={handlePromotionCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Disabled overlay ─────────────────────────────────────────────── */}
      {disabled && <div className={styles.disabledOverlay} aria-hidden="true" />}
    </div>
  );
}
