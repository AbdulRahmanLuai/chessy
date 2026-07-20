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

// Result shape for username-prefix search (e.g. "challenge by username" lookup).
// Deliberately separate from `User` — search results may be a trimmed-down
// projection server-side and we don't want to imply email/createdAt are present.
export interface UserSearchResult {
  id: string;
  username: string;
  displayName: string;
}

export type ChallengeTargetMode = 'friend' | 'username';


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
  otherUserId: string;
  otherUsername: string;
  otherDisplayName: string;
  requesterId: string;
  status: FriendshipStatus;
  createdAt: string;
}
// ─── Game ──────────────────────────────────────────────────────────────────────

export type GameStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED';
export type ResultReason =
  | 'CHECKMATE'
  | 'STALEMATE'
  | 'THREEFOLD_REPETITION'
  | 'INSUFFICIENT_MATERIAL'
  | 'FIFTY_MOVE_RULE'
  | 'TIMEOUT'
  | 'RESIGNATION'
  | 'DRAW_AGREEMENT'
  | 'ABORTED';

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
  winner: string | null;
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

// ─── Computer Game ─────────────────────────────────────────────────────────────

export type ComputerGameDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

// Only one engine exists today, but keep this a union so adding a new
// engine later is a type-level change, not a silent string.
export type ComputerEngine = 'RANDOM';

export type ComputerGameUserColor = 'WHITE' | 'BLACK';

// What the user picks before the game exists — 'RANDOM' is resolved
// server-side into a ComputerGameUserColor once the game is created.
export type ColorPreference = 'WHITE' | 'BLACK' | 'RANDOM';

export interface ComputerGame {
  id: string;
  userId: string;
  userColor: ComputerGameUserColor;
  status: GameStatus;
  currentFen: string;
  moves: Move[];
  difficulty: ComputerGameDifficulty;
  engine: ComputerEngine;
  result: string | null;
  resultReason: string | null;
  isTimed: boolean;
  timeInitialSeconds: number | null;
  timeIncrementSeconds: number | null;
  whiteTimeRemainingMs: number;
  blackTimeRemainingMs: number;
  lastMoveAt: string | null;
  currentPlayerDeadlineAt: string | null;
  createdAt: string;
  finishedAt: string | null;
}

export interface CreateComputerGameRequest {
  difficulty: ComputerGameDifficulty;
  engine: ComputerEngine;
  isTimed: boolean;
  timeInitialSeconds?: number;
  timeIncrementSeconds?: number;
  colorPreference: ColorPreference;
}


