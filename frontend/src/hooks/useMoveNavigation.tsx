import { useState, useEffect, useMemo } from 'react';
import { computeFenAtPly } from '@/utils/chess';
import type { Move } from '@/types';

export interface UseMoveNavigationResult {
  viewedPly: number;
  setViewedPly: (ply: number) => void;
  fen: string;
  isAtStart: boolean;
  isAtEnd: boolean;
  goFirst: () => void;
  goPrev: () => void;
  goNext: () => void;
  goLast: () => void;
}

/**
 * Tracks which ply of a move list is currently being viewed, and derives
 * the FEN at that ply. Snaps to the latest move whenever the move list
 * grows (live games) — a no-op for static move arrays (past games).
 */
export function useMoveNavigation(
  moves: Move[],
  startFen?: string,
): UseMoveNavigationResult {
  const [viewedPly, setViewedPly] = useState(moves.length - 1);

  useEffect(() => {
    setViewedPly(moves.length - 1);
  }, [moves.length]);

  const fen = useMemo(
    () => computeFenAtPly(moves, viewedPly, startFen),
    [moves, viewedPly, startFen],
  );

  const isAtStart = viewedPly === -1;
  const isAtEnd = viewedPly === moves.length - 1;

  return {
    viewedPly,
    setViewedPly,
    fen,
    isAtStart,
    isAtEnd,
    goFirst: () => setViewedPly(-1),
    goPrev: () => setViewedPly((p) => Math.max(-1, p - 1)),
    goNext: () => setViewedPly((p) => Math.min(moves.length - 1, p + 1)),
    goLast: () => setViewedPly(moves.length - 1),
  };
}