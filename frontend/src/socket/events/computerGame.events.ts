// src/socket/events/computerGame.events.ts
//
// ─────────────────────────────────────────────────────────────
// CLIENT → SERVER EVENTS
// ─────────────────────────────────────────────────────────────
//

import type { Square, PieceSymbol } from '@/types';

export interface ComputerGameRoomPayload {
  gameId: string;
}

export interface ComputerGameMovePayload {
  gameId: string;
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
}

export interface ComputerGameClientToServerEvents {
  'computerGame:join': (payload: ComputerGameRoomPayload) => void;
  'computerGame:leave': (payload: ComputerGameRoomPayload) => void;
  'computerGame:move': (payload: ComputerGameMovePayload) => void;
  'computerGame:resign': (payload: ComputerGameRoomPayload) => void;
  // STUB: event name unconfirmed against backend — wire up properly once
  // the ComputerGame abort contract is finalized.
  'computerGame:abort': (payload: ComputerGameRoomPayload) => void;
}

//
// ─────────────────────────────────────────────────────────────
// SERVER → CLIENT EVENTS
// ─────────────────────────────────────────────────────────────
//

export interface ComputerGameMoveDetail {
  from: string;
  to: string;
  promotion?: string;
  san: string;
}

export interface ComputerGameMoveAppliedEvent {
  gameId: string;
  move: ComputerGameMoveDetail;
  fen: string;
  whiteTimeRemainingMs: number;
  blackTimeRemainingMs: number;
}

export interface ComputerGameEndedEvent {
  gameId: string;
  result: string;   // e.g. "1-0", "0-1", "1/2-1/2"
  winner: string;   // userId or "DRAW"
  resultReason: string;
}

export interface ComputerGameServerToClientEvents {
  'computerGame:moveApplied': (payload: ComputerGameMoveAppliedEvent) => void;
  'computerGame:ended': (payload: ComputerGameEndedEvent) => void;
  'computerGame:botMoveFailed': (message: string) => void;
}