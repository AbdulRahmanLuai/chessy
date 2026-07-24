import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import { gameSocketService } from '@/socket/gameSocketService';
import { gameService } from '@/services/game.service';
import { getSocket, onSocketReady } from '@/socket/socket';
import type { DrawOfferedEvent } from '@/socket/events/game.events';

import type {
  Square,
  PieceSymbol,
  Color,
  Game,
} from '@/types';

// ─── Hook return type ─────────────────────────────────────────────────────────

interface UseGameReturn {
  handleMoveAttempt: (from: Square, to: Square, promotion?: PieceSymbol) => boolean;
  handleResign:      () => void;
  handleOfferDraw:   () => void;
  handleAbort:       () => void;
  handleAcceptDraw:  () => void;
  handleDeclineDraw: () => void;
  drawOfferReceived: boolean;
  drawOfferSent:     boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGame(gameId: string): UseGameReturn {
  const setGame     = useGameStore((s) => s.setGame);
  const setLoading  = useGameStore((s) => s.setLoading);
  const applyMove   = useGameStore((s) => s.applyMove);
  const setResult   = useGameStore((s) => s.setResult);

  const game        = useGameStore((s) => s.game);
  const currentUser = useAuthStore((s) => s.user);

  const [drawOfferReceived, setDrawOfferReceived] = useState(false);
  const [drawOfferSent, setDrawOfferSent] = useState(false);

  // ─── Load + join game ──────────────────────────────────────────────────────

  useEffect(() => {
    
    if (!currentUser) return;

    //ignore stale requests if user navigates away before fetch completes
    let isActive = true;

    setLoading(true);

    if (!isActive) return;

    const loadGame = async () => {
      const game = await gameService.getGame(gameId);
      setGame(game);
    };
    loadGame();
    console.log('Joining game room', gameId);

    gameSocketService.join(gameId);
    setLoading(false);

    return () => {
      isActive = false;
      gameSocketService.leave(gameId);
      setGame(null);
      setDrawOfferReceived(false);
      setDrawOfferSent(false);
    };
  }, [gameId, currentUser]);

  // ─── Socket event listeners ────────────────────────────────────────────────

  useEffect(() => {
    let cleanupListeners: (() => void) | null = null;

    const setupListeners = () => {
      const socket = getSocket();
      if (!socket) return; // defensive; shouldn't happen once called from onSocketReady

      // move applied from server (authoritative)
      const onMoveApplied = (payload: any) => {
        console.log('Move applied from server', payload);
        // A move supersedes any outstanding draw offer.
        setDrawOfferSent(false);
        setDrawOfferReceived(false);
        applyMove(
          payload.move,
          payload.fen,
          payload.whiteTimeRemainingMs,
          payload.blackTimeRemainingMs,
          payload.movedAt
        );
      };

      const onDrawOffered = (payload: DrawOfferedEvent) => {
        console.log("Draw offer received from opponent");
        setDrawOfferReceived(payload.byUserId !== currentUser?.id);
      };

      const onDrawAccepted = () => {
        setDrawOfferSent(false);
        setDrawOfferReceived(false);
      };

      const onDrawDeclined = () => {
        setDrawOfferSent(false);
        setDrawOfferReceived(false);
      };

      const onGameEnded = (payload: any) => {
        console.log('Game ended from server', payload);
        setResult(
          'COMPLETED',
          { winner: payload.winner, reason: payload.reason },
          payload.reason,
        );
      };

      socket.on('game:moveApplied', onMoveApplied);
      socket.on('game:drawOffered', onDrawOffered);
      socket.on('game:drawAccepted', onDrawAccepted);
      socket.on('game:drawDeclined', onDrawDeclined);
      socket.on('game:ended', onGameEnded);
      console.log('Socket listeners set up for game', gameId);

      cleanupListeners = () => {
        console.log('Cleaning up socket listeners for game', gameId);
        socket.off('game:moveApplied', onMoveApplied);
        socket.off('game:drawOffered', onDrawOffered);
        socket.off('game:drawAccepted', onDrawAccepted);
        socket.off('game:drawDeclined', onDrawDeclined);
        socket.off('game:ended', onGameEnded);
      };
    };

    const unsubscribeReady = onSocketReady(setupListeners);

    return () => {
      unsubscribeReady();
      cleanupListeners?.();
    };
  }, [applyMove, setResult, currentUser]);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const myColor: Color = (() => {
    if (!game || !currentUser) return 'white';
    return game.whitePlayer.id === currentUser.id ? 'white' : 'black';
  })();

  // ─── Actions → server ──────────────────────────────────────────────────────

  const handleMoveAttempt = useCallback(
    (from: Square, to: Square, promotion?: PieceSymbol): boolean => {
      if (!game) return false;

      gameSocketService.move({
        gameId,
        from,
        to,
        promotion,
      });

      return true;
    },
    [gameId, game],
  );

  const handleResign = useCallback(() => {
    gameSocketService.resign(gameId);
  }, [gameId]);

  const handleOfferDraw = useCallback(() => {
    setDrawOfferSent(true);
    gameSocketService.offerDraw(gameId);
  }, [gameId]);

  const handleAbort = useCallback(() => {
    gameSocketService.abort(gameId);
  }, [gameId]);

  const handleAcceptDraw = useCallback(() => {
    setDrawOfferReceived(false);
    gameSocketService.acceptDraw(gameId);
  }, [gameId]);

  const handleDeclineDraw = useCallback(() => {
    setDrawOfferReceived(false);
    gameSocketService.declineDraw(gameId);
  }, [gameId]);

  // ─── Return ────────────────────────────────────────────────────────────────

  return {
    handleMoveAttempt,
    handleResign,
    handleOfferDraw,
    handleAbort,
    handleAcceptDraw,
    handleDeclineDraw,
    drawOfferReceived,
    drawOfferSent,
  };
}
