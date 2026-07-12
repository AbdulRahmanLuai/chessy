import { create } from 'zustand';
import type { Game, Move, GameResult, ResultReason, GameStatus } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GameStore {
  game:      Game | null;
  isLoading: boolean;

  setGame:    (game: Game | null) => void;
  setLoading: (loading: boolean) => void;

  /**
   * Appends a move and updates the position + clocks.
   * Clock times come from the server on every game:move event —
   * the server is the authoritative source.
   */
  applyMove: (
    move: Move,
    nextFen: string,
    whiteTimeRemainingMs: number,
    blackTimeRemainingMs: number,
  ) => void;

  /** Marks the game as finished with result + reason. */
  setResult: (
    status: Extract<GameStatus, 'COMPLETED' | 'ABORTED'>,
    result: GameResult,
    resultReason: ResultReason,
  ) => void;

  /** Full reset on leaving the game page. */
  reset: () => void;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_STATE = {
  game:      null as Game | null,
  isLoading: false,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set) => ({
  ...INITIAL_STATE,

  setGame: (game) => set({ game }),

  setLoading: (isLoading) => set({ isLoading }),

  applyMove: (move, nextFen, whiteTimeRemainingMs, blackTimeRemainingMs) =>
    set((state) => {
      if (!state.game){
         return state;
         console.log('No game in state to apply move to');
      }
      return {
        game: {
          ...state.game,
          currentFen:           nextFen,
          moves:                [...state.game.moves, move],
          whiteTimeRemainingMs,
          blackTimeRemainingMs,
          lastMoveAt:           new Date().toISOString(),
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

  reset: () => set(INITIAL_STATE),
}));