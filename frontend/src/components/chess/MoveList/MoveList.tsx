import type { Move } from '@/types';
import styles from './MoveList.module.css';
import { useEffect, useRef, useMemo, forwardRef } from 'react';
// ─── Types ────────────────────────────────────────────────────────────────────

export interface MoveListProps {
  moves: Move[];
  /**
   * Index of the currently active move (0-based).
   * Defaults to the last move. Used to highlight and scroll to position.
   * Pass a controlled value to support move navigation (analysis mode).
   */
  currentMoveIndex?: number;
  /**
   * Called when the user clicks a move.
   * Provides the 0-based index into the moves array.
   * Omit to make the list non-interactive (live game view).
   */
  onMoveClick?: (index: number) => void;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface MovePair {
  moveNumber: number;
  white: Move;
  whiteIndex: number;
  black: Move | null;
  blackIndex: number | null;
}

/** Groups a flat move array into display pairs (white + black per row) */
function groupIntoPairs(moves: Move[]): MovePair[] {
  const pairs: MovePair[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white:      moves[i],
      whiteIndex: i,
      black:      moves[i + 1] ?? null,
      blackIndex: moves[i + 1] !== undefined ? i + 1 : null,
    });
  }
  return pairs;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MoveList({
  moves,
  currentMoveIndex,
  onMoveClick,
  className,
}: MoveListProps) {
  console.log('Rendering MoveList with moves:', moves, 'currentMoveIndex:', currentMoveIndex);
  // Default active index to the last move
  const activeIndex =
    currentMoveIndex !== undefined ? currentMoveIndex : moves.length - 1;

  const pairs = useMemo(() => groupIntoPairs(moves), [moves]);

  // ── Auto-scroll to the active move ───────────────────────────────────────

  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [activeIndex]);

  // ── Empty state ───────────────────────────────────────────────────────────

  if (moves.length === 0) {
    return (
      <div className={`${styles.root} ${className ?? ''}`}>
        <div className={styles.header}>
          <span className={styles.headerLabel}>Moves</span>
        </div>
        <div className={styles.empty}>
          <span>Game has not started</span>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className={`${styles.root} ${className ?? ''}`}
      role="region"
      aria-label="Move history"
    >
      <div className={styles.header}>
        <span className={styles.headerLabel}>Moves</span>
        <span className={styles.moveCount} aria-live="polite" aria-atomic="true">
          {Math.ceil(moves.length / 2)} / {Math.ceil(moves.length / 2)}
        </span>
      </div>

      <div className={styles.listWrapper}>
        <ol className={styles.list} aria-label="Move list">
          {pairs.map((pair) => (
            <li key={pair.moveNumber} className={styles.pair}>
              {/* Move number */}
              <span className={styles.moveNumber} aria-hidden="true">
                {pair.moveNumber}.
              </span>

              {/* White's move */}
              <MoveCell
                san={pair.white.san}
                index={pair.whiteIndex}
                isActive={activeIndex === pair.whiteIndex}
                isInteractive={!!onMoveClick}
                onClick={onMoveClick}
                ref={activeIndex === pair.whiteIndex ? activeRef : null}
              />

              {/* Black's move — empty placeholder keeps layout stable */}
              {pair.black !== null && pair.blackIndex !== null ? (
                <MoveCell
                  san={pair.black.san}
                  index={pair.blackIndex}
                  isActive={activeIndex === pair.blackIndex}
                  isInteractive={!!onMoveClick}
                  onClick={onMoveClick}
                  ref={activeIndex === pair.blackIndex ? activeRef : null}
                />
              ) : (
                <span className={styles.emptyCell} aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ─── MoveCell ─────────────────────────────────────────────────────────────────
// Local render helper — not exported, not a named component export (rule 10).
// A button when interactive, a span when display-only.

interface MoveCellProps {
  san: string;
  index: number;
  isActive: boolean;
  isInteractive: boolean;
  onClick?: (index: number) => void;
  // ref removed from here
}

const MoveCell = forwardRef<HTMLButtonElement | HTMLSpanElement, MoveCellProps>(
  ({ san, index, isActive, isInteractive, onClick }, ref) => {
    const cellClass = [
      styles.moveCell,
      isActive ? styles.activeMove : '',
      isInteractive ? styles.interactive : '',
    ]
      .filter(Boolean)
      .join(' ');

    if (isInteractive && onClick) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          className={cellClass}
          onClick={() => onClick(index)}
          aria-current={isActive ? 'true' : undefined}
          aria-label={`Move ${index + 1}: ${san}`}
        >
          {san}
        </button>
      );
    }

    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        className={cellClass}
        aria-current={isActive ? 'true' : undefined}
      >
        {san}
      </span>
    );
  }
);

MoveCell.displayName = 'MoveCell';