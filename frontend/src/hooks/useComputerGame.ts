// src/hooks/useComputerGame.ts

import { useState, useEffect, useCallback } from 'react';
import { useComputerGameStore } from '@/store/computerGameStore';
import { useAuthStore } from '@/store/authStore';
import { computerGameSocketService } from '@/socket/computerGameSocketService';
import { computerService } from '@/services/computer.service';
import { getSocket, onSocketReady } from '@/socket/socket';
import type { Square, PieceSymbol } from '@/types';
import type {
  ComputerGameMoveAppliedEvent,
  ComputerGameEndedEvent,
} from '@/socket/events';

// ─── Hook return type ─────────────────────────────────────────────────────────

interface UseComputerGameReturn {
  handleMoveAttempt: (from: Square, to: Square, promotion?: PieceSymbol) => boolean;
  handleResign: () => void;
  handleAbort: () => void;
  botMoveError: string | null;
  clearBotMoveError: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useComputerGame(gameId: string): UseComputerGameReturn {
  const setGame = useComputerGameStore((s) => s.setGame);
  const setLoading = useComputerGameStore((s) => s.setLoading);
  const applyMove = useComputerGameStore((s) => s.applyMove);
  const setResult = useComputerGameStore((s) => s.setResult);

  const game = useComputerGameStore((s) => s.game);
  const currentUser = useAuthStore((s) => s.user);

  const [botMoveError, setBotMoveError] = useState<string | null>(null);

  // ─── Load + join game ──────────────────────────────────────────────────────

  useEffect(() => {
  if (!currentUser) return;

  let isActive = true;

  const loadGame = async () => {
    try {
      setLoading(true);

      const loaded = await computerService.getGame(gameId);

      if (!isActive) return;

      setGame(loaded);
      computerGameSocketService.join(gameId);
    } finally {
      if (isActive) {
        setLoading(false);
      }
    }
  };

  loadGame();

  return () => {
    isActive = false;
    computerGameSocketService.leave(gameId);
    setGame(null);
    setBotMoveError(null);
  };
}, [gameId, currentUser]);
  // ─── Socket event listeners ────────────────────────────────────────────────

  useEffect(() => {
    let cleanupListeners: (() => void) | null = null;

    const setupListeners = () => {
      const socket = getSocket();
      if (!socket) return;

      const onMoveApplied = (payload: ComputerGameMoveAppliedEvent) => {
        console.log('computer game move applied:', payload);
        console.log("movedAt: ", payload.movedAt)
        applyMove(
          payload.move,
          payload.fen,
          payload.whiteTimeRemainingMs,
          payload.blackTimeRemainingMs,
          payload.movedAt
        );
      };

      const onGameEnded = (payload: ComputerGameEndedEvent) => {
        console.log('computer game ended:', payload);
        setResult('COMPLETED', payload.result, payload.resultReason);
      };

      // Non-terminal: bot failed to produce a move. Surface the error and
      // let the player retry rather than ending the game or redirecting away.
      const onBotMoveFailed = (message: string) => {
        setBotMoveError(message || 'The bot failed to move. Please try again.');
      };

      socket.on('computerGame:moveApplied', onMoveApplied);
      socket.on('computerGame:ended', onGameEnded);
      socket.on('computerGame:botMoveFailed', onBotMoveFailed);

      cleanupListeners = () => {
        socket.off('computerGame:moveApplied', onMoveApplied);
        socket.off('computerGame:ended', onGameEnded);
        socket.off('computerGame:botMoveFailed', onBotMoveFailed);
      };
    };

    const unsubscribeReady = onSocketReady(setupListeners);

    return () => {
      unsubscribeReady();
      cleanupListeners?.();
    };
  }, [applyMove, setResult]);

  // ─── Actions → server ──────────────────────────────────────────────────────

  const handleMoveAttempt = useCallback(
    (from: Square, to: Square, promotion?: PieceSymbol): boolean => {
      if (!game) return false;
      setBotMoveError(null);
      computerGameSocketService.move({ gameId, from, to, promotion });
      return true;
    },
    [gameId, game],
  );

  const handleResign = useCallback(() => {
    computerGameSocketService.resign(gameId);
  }, [gameId]);

  const handleAbort = useCallback(() => {
    computerGameSocketService.abort(gameId);
  }, [gameId]);

  const clearBotMoveError = useCallback(() => setBotMoveError(null), []);

  // ─── Return ────────────────────────────────────────────────────────────────

  return {
    handleMoveAttempt,
    handleResign,
    handleAbort,
    botMoveError,
    clearBotMoveError,
  };
}