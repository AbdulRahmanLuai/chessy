import { useState, useMemo, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import type { Square, Color, PieceSymbol } from '@/types';
import styles from './Board.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const BOARD_LIGHT  = '#F0D9B5';
const BOARD_DARK   = '#B58863';

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

function rankOf(square: Square): number {
  return parseInt(square[1], 10);
}

function isPromotionMove(piece: string, to: Square): boolean {
  const isPawn = piece[1]?.toLowerCase() === 'p';
  const rank   = rankOf(to);
  return isPawn && (rank === 8 || rank === 1);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BoardProps {
  fen: string;
  orientation: Color;
  onMoveAttempt: (from: Square, to: Square, promotion?: PieceSymbol) => boolean;
  lastMove?: { from: Square; to: Square } | null;
  checkSquare?: Square | null;
  disabled?: boolean;
  className?: string;
}

interface ClickPromotion {
  from: Square;
  to: Square;
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
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  // Tracks a promotion move initiated by click-to-move, so we can manually
  // trigger the library's own promotion dialog (drag-initiated promotions
  // are detected automatically via onPromotionCheck).
  const [clickPromotion, setClickPromotion] = useState<ClickPromotion | null>(null);

  const chess = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }, [fen]);

  const legalDestinations = useMemo<Set<Square>>(() => {
    if (!selectedSquare) return new Set();
    const moves = chess.moves({ square: selectedSquare, verbose: true });
    return new Set(moves.map((m) => m.to as Square));
  }, [chess, selectedSquare]);

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
        sq[dest] = occupied ? SQ_VALID_CAPTURE : SQ_VALID_MOVE;
      });
    }

    return sq;
  }, [lastMove, checkSquare, selectedSquare, legalDestinations, chess]);

  // ── Attempt a move (drag path only — click path handled separately below) ─

  const attemptMove = useCallback(
    (from: Square, to: Square): boolean => {
      if (disabled) return false;
      const accepted = onMoveAttempt(from, to);
      if (accepted) setSelectedSquare(null);
      return accepted;
    },
    [disabled, onMoveAttempt],
  );

  const handlePieceDrop = useCallback(
    (source: string, target: string): boolean => {
      return attemptMove(source as Square, target as Square);
    },
    [attemptMove],
  );

  // ── Click-to-move handler ─────────────────────────────────────────────────

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (disabled) return;

      if (!selectedSquare) {
        const piece = chess.get(square);
        if (piece && piece.color === chess.turn()) {
          setSelectedSquare(square);
        }
        return;
      }

      if (square === selectedSquare) {
        setSelectedSquare(null);
        return;
      }

      const target = chess.get(square);
      if (target && target.color === chess.turn()) {
        setSelectedSquare(square);
        return;
      }

      const movingPiece = chess.get(selectedSquare);
      if (!movingPiece) {
        setSelectedSquare(null);
        return;
      }

      const activeColor = chess.turn() === 'w' ? 'white' : 'black';
      const pieceStr = `${activeColor === 'white' ? 'w' : 'b'}${movingPiece.type.toUpperCase()}`;

      if (isPromotionMove(pieceStr, square)) {
        // Manually trigger the library's own promotion dialog instead of moving directly.
        setClickPromotion({ from: selectedSquare, to: square });
        setSelectedSquare(null);
        return;
      }

      attemptMove(selectedSquare, square);
    },
    [disabled, chess, selectedSquare, attemptMove],
  );

  // ── Promotion piece selected (covers both drag and click flows) ───────────

  const handlePromotionPieceSelect = useCallback(
    (piece?: string, promoteFromSquare?: Square, promoteToSquare?: Square): boolean => {
      if (!piece) {
        setClickPromotion(null);
        return false;
      }

      const from = promoteFromSquare ?? clickPromotion?.from;
      const to   = promoteToSquare ?? clickPromotion?.to;

      if (!from || !to) {
        setClickPromotion(null);
        return false;
      }

      // piece comes back like 'wQ' / 'bN' — extract the symbol chess.js expects.
      const promotion = piece[1]?.toLowerCase() as PieceSymbol;

      const accepted = onMoveAttempt(from, to, promotion);
      setClickPromotion(null);
      return accepted;
    },
    [onMoveAttempt, clickPromotion],
  );

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
        promotionDialogVariant="default"
        onPromotionPieceSelect={handlePromotionPieceSelect}
        showPromotionDialog={!!clickPromotion}
        promotionToSquare={clickPromotion?.to ?? null}
      />

      {/* ── Disabled overlay ─────────────────────────────────────────────── */}
      {disabled && <div className={styles.disabledOverlay} aria-hidden="true" />}
    </div>
  );
}