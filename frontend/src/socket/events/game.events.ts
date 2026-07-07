import type { PieceSymbol, Square } from '@/types';

//
// ─────────────────────────────────────────────────────────────
// CLIENT → SERVER EVENTS
// ─────────────────────────────────────────────────────────────
//

export interface JoinGamePayload {
  gameId: string;
}

export interface LeaveGamePayload {
  gameId: string;
}

export interface MovePayload {
  gameId: string;
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
}

export interface GameActionPayload {
  gameId: string;
}

export interface GameClientToServerEvents {
  'game:join': (payload: JoinGamePayload) => void;
  'game:leave': (payload: LeaveGamePayload) => void;
  'game:move': (payload: MovePayload) => void;
  'game:resign': (payload: GameActionPayload) => void;
  'game:abort': (payload: GameActionPayload) => void;
  'game:offerDraw': (payload: GameActionPayload) => void;
  'game:acceptDraw': (payload: GameActionPayload) => void;
  'game:declineDraw': (payload: GameActionPayload) => void;
}

//
// ─────────────────────────────────────────────────────────────
// SERVER → CLIENT EVENTS (STATE DELTAS)
// ─────────────────────────────────────────────────────────────
//

export interface MoveAppliedEvent {
  gameId: string;
  move: {
    from: Square;
    to: Square;
    promotion?: PieceSymbol;
  };
  fen: string;
  whiteTimeRemainingMs: number;
  blackTimeRemainingMs: number;
}

export interface DrawOfferedEvent {
  byUserId: string;
}

export interface GameEndedEvent {
  gameId: string;
  result: string;
  reason: string;
}

export interface GameServerToClientEvents {
  'game:loaded': (payload: {
    fen: string;
    whiteTimeRemainingMs: number;
    blackTimeRemainingMs: number;
  }) => void;
  'game:moveApplied': (payload: MoveAppliedEvent) => void;
  'game:drawOffered': (payload: DrawOfferedEvent) => void;
  'game:drawAccepted': (payload: { gameId: string }) => void;
  'game:drawDeclined': (payload: { gameId: string }) => void;
  'game:ended': (payload: GameEndedEvent) => void;
  'game:error': (message: string) => void;
}