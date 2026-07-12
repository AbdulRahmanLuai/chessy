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
    console.log('Offering draw for game', gameId);
    emitWhenReady('game:offerDraw', { gameId });
  },

  acceptDraw(gameId: string) {
    console.log('Accepting draw for game', gameId);
    emitWhenReady('game:acceptDraw', { gameId });
  },

  declineDraw(gameId: string) {
    console.log('Declining draw for game', gameId);
    emitWhenReady('game:declineDraw', { gameId });
  },
};