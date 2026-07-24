// src/store/computerGameStore.ts

import { create } from 'zustand';
import type { ComputerGame, Move } from '@/types';
import type { ComputerGameMoveDetail } from '@/socket/events';

// ─── Store shape ────────────────────────────────────────────────────────────────

interface ComputerGameState {
  game: ComputerGame | null;
  isLoading: boolean;
  setGame: (game: ComputerGame | null) => void;
  setLoading: (isLoading: boolean) => void;
  applyMove: (
    move: ComputerGameMoveDetail,
    fen: string,
    whiteTimeRemainingMs: number,
    blackTimeRemainingMs: number,
    movedAt: string
  ) => void;
  setResult: (
    status: 'COMPLETED',
    result: string,
    resultReason: string,
  ) => void;
}

// ─── Store ──────────────────────────────────────────────────────────────────────

export const useComputerGameStore = create<ComputerGameState>((set) => ({
  game: null,
  isLoading: false,

  setGame: (game) => set({ game }),

  setLoading: (isLoading) => set({ isLoading }),

  applyMove: (moveDetail, fen, whiteTimeRemainingMs, blackTimeRemainingMs, movedAt) =>
    set((state) => {
      if (!state.game) return state;

      // The socket payload doesn't include color/timestamp — color is derived
      // from move parity (white always moves first), timestamp from receipt time.
      const color: Move['color'] = state.game.moves.length % 2 === 0 ? 'w' : 'b';

      const move: Move = {
        from: moveDetail.from,
        to: moveDetail.to,
        promotion: moveDetail.promotion,
        san: moveDetail.san,
        color,
        timestamp: Date.now(),
      };

      return {
        game: {
          ...state.game,
          currentFen: fen,
          moves: [...state.game.moves, move],
          whiteTimeRemainingMs,
          blackTimeRemainingMs,
          lastMoveAt: movedAt
        },
      };
    }),

  setResult: (status, result, resultReason) =>
    set((state) => {
      if (!state.game) return state;
      return {
        game: {
          ...state.game,
          status,
          result,
          resultReason,
          finishedAt: new Date().toISOString(),
        },
      };
    }),
}));