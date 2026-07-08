import { getSocket } from './socket';
import type { PieceSymbol, Square } from '@/types';

export const gameSocketService = {
  join(gameId: string) {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('game:join', { gameId });
  },

  leave(gameId: string) {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('game:leave', { gameId });
  },

  move(params: {
    gameId: string;
    from: Square;
    to: Square;
    promotion?: PieceSymbol;
  }) {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('game:move', params);
  },

  resign(gameId: string) {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('game:resign', { gameId });
  },

  abort(gameId: string) {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('game:abort', { gameId });
  },

  offerDraw(gameId: string) {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('game:offerDraw', { gameId });
  },

  acceptDraw(gameId: string) {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('game:acceptDraw', { gameId });
  },

  declineDraw(gameId: string) {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('game:declineDraw', { gameId });
  },
};