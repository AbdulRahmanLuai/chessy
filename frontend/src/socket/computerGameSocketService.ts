// src/socket/computerGameSocketService.ts

import { emitWhenReady } from './socket';
import type { ComputerGameMovePayload, ComputerGameRoomPayload } from './events';

export const computerGameSocketService = {
  join(gameId: string) {
    emitWhenReady('computerGame:join', { gameId } satisfies ComputerGameRoomPayload);
  },

  leave(gameId: string) {
    emitWhenReady('computerGame:leave', { gameId } satisfies ComputerGameRoomPayload);
  },

  move(payload: ComputerGameMovePayload) {
    emitWhenReady('computerGame:move', payload);
  },

  resign(gameId: string) {
    emitWhenReady('computerGame:resign', { gameId } satisfies ComputerGameRoomPayload);
  },

  
  abort(gameId: string) {
    emitWhenReady('computerGame:abort', { gameId } satisfies ComputerGameRoomPayload);
  },
};