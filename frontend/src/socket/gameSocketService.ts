import { emitWhenReady } from './socket';
import type { PieceSymbol, Square } from '@/types';

export const gameSocketService = {
  join(gameId: string) {
    emitWhenReady('game:join', { gameId });
  },

  leave(gameId: string) {
    emitWhenReady('game:leave', { gameId });
  },

  move(params: {
    gameId: string;
    from: Square;
    to: Square;
    promotion?: PieceSymbol;
  }) {
    emitWhenReady('game:move', params);
  },

  resign(gameId: string) {
    emitWhenReady('game:resign', { gameId });
  },

  abort(gameId: string) {
    emitWhenReady('game:abort', { gameId });
  },

  offerDraw(gameId: string) {
    emitWhenReady('game:offerDraw', { gameId });
  },

  acceptDraw(gameId: string) {
    emitWhenReady('game:acceptDraw', { gameId });
  },

  declineDraw(gameId: string) {
    emitWhenReady('game:declineDraw', { gameId });
  },
};