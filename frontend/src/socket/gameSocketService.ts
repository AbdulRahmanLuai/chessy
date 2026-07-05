import { getSocket } from './socket';
import type { PieceSymbol, Square } from '@/types';

export const gameSocketService = {
  join(gameId: string) {
    getSocket().emit('game:join', { gameId });
  },

  leave(gameId: string) {
    getSocket().emit('game:leave', { gameId });
  },

  move(params: {
    gameId: string;
    from: Square;
    to: Square;
    promotion?: PieceSymbol;
  }) {
    getSocket().emit('game:move', params);
  },

  resign(gameId: string) {
    getSocket().emit('game:resign', { gameId });
  },

  abort(gameId: string) {
    getSocket().emit('game:abort', { gameId });
  },

  offerDraw(gameId: string) {
    getSocket().emit('game:offerDraw', { gameId });
  },

  acceptDraw(gameId: string) {
    getSocket().emit('game:acceptDraw', { gameId });
  },

  declineDraw(gameId: string) {
    getSocket().emit('game:declineDraw', { gameId });
  },
};