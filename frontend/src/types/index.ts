// src/types/index.ts
// All domain types for Chessy. Never define types elsewhere.
// Import from this file everywhere: import type { Game, Player } from '@/types'

// ─── Primitives ────────────────────────────────────────────────────────────────

export type Color = 'white' | 'black';

export type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export type Square =
  | 'a1' | 'b1' | 'c1' | 'd1' | 'e1' | 'f1' | 'g1' | 'h1'
  | 'a2' | 'b2' | 'c2' | 'd2' | 'e2' | 'f2' | 'g2' | 'h2'
  | 'a3' | 'b3' | 'c3' | 'd3' | 'e3' | 'f3' | 'g3' | 'h3'
  | 'a4' | 'b4' | 'c4' | 'd4' | 'e4' | 'f4' | 'g4' | 'h4'
  | 'a5' | 'b5' | 'c5' | 'd5' | 'e5' | 'f5' | 'g5' | 'h5'
  | 'a6' | 'b6' | 'c6' | 'd6' | 'e6' | 'f6' | 'g6' | 'h6'
  | 'a7' | 'b7' | 'c7' | 'd7' | 'e7' | 'f7' | 'g7' | 'h7'
  | 'a8' | 'b8' | 'c8' | 'd8' | 'e8' | 'f8' | 'g8' | 'h8';

// ─── User & Auth ───────────────────────────────────────────────────────────────

// ─── User ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  createdAt: string;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  login: string;    // email or username
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  displayName: string;
  username: string;
}

export interface AuthResponse {
  accessToken: string;
  userId: string;
  email: string;
  displayName: string;
  username: string;
}

// ─── Friendship ────────────────────────────────────────────────────────────────

export type FriendshipStatus = 'PENDING' | 'ACCEPTED';

export interface Friendship {
  id: string;
  user1: User;
  user2: User;
  requester: User;
  status: FriendshipStatus;
  createdAt: string;
}

// ─── Game ──────────────────────────────────────────────────────────────────────

export type GameStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED';
export type ResultReason = 'checkmate' | 'resignation' | 'timeout' | 'stalemate' | 'agreement';

export interface TimeControl {
  initialSeconds: number;
  incrementSeconds: number;
}

export interface Move {
  from: string;
  to: string;
  promotion?: string;
  san: string;
  color: 'w' | 'b';
  timestamp: number;
}

export interface GamePlayer {
  user: User;
  color: 'white' | 'black';
  timeRemainingMs: number;
  isConnected: boolean;
}

export interface GameResult {
  winner: 'white' | 'black' | 'draw';
  reason: ResultReason;
}

export interface Game {
  id: string;
  status: GameStatus;
  currentFen: string;
  whitePlayer: User;
  blackPlayer: User | null;
  moves: Move[];
  timeControl: TimeControl;
  whiteTimeRemainingMs: number;
  blackTimeRemainingMs: number;
  lastMoveAt: string | null;
  result: GameResult | null;
  resultReason: ResultReason | null;
  createdAt: string;
  finishedAt: string | null;
}

// ─── WebSocket Events ──────────────────────────────────────────────────────────

export type ServerEvent =
  | { type: 'game:started';          payload: Game }
  | { type: 'game:move';             payload: { gameId: string; move: Move } }
  | { type: 'game:over';             payload: { gameId: string; result: GameResult; reason: ResultReason } }
  | { type: 'game:timeout';          payload: { gameId: string; loser: Color } }
  | { type: 'opponent:connected';    payload: { gameId: string } }
  | { type: 'opponent:disconnected'; payload: { gameId: string } }
  | { type: 'friend:online';         payload: { userId: string } }
  | { type: 'friend:offline';        payload: { userId: string } }
  | { type: 'challenge:received';    payload: { gameId: string; from: User; timeControl: TimeControl } }
  | { type: 'challenge:accepted';    payload: { gameId: string } }
  | { type: 'challenge:declined';    payload: { gameId: string } };

export type ClientEvent =
  | { type: 'game:move';         payload: { gameId: string; from: string; to: string; promotion?: string } }
  | { type: 'game:resign';       payload: { gameId: string } }
  | { type: 'game:offerDraw';    payload: { gameId: string } }
  | { type: 'game:acceptDraw';   payload: { gameId: string } }
  | { type: 'game:declineDraw';  payload: { gameId: string } }
  | { type: 'challenge:send';    payload: { toUserId: string; timeControl: TimeControl } }
  | { type: 'challenge:accept';  payload: { gameId: string } }
  | { type: 'challenge:decline'; payload: { gameId: string } };

// ─── API ───────────────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}