// src/socket/events/challenge.events.ts
//
// ─────────────────────────────────────────────────────────────
// CLIENT → SERVER EVENTS
// ─────────────────────────────────────────────────────────────
//

export type PreferredColor = 'WHITE' | 'BLACK' | 'RANDOM';

export interface SendChallengePayload {
  challengedUserId: string;
  preferredColor: PreferredColor;
  timeLimitSeconds: number;
  incrementSeconds: number;
}

export interface RespondChallengePayload {
  challengeId: string;
}

export interface ChallengeClientToServerEvents {
  /** Requests all active challenges after the client has installed its listeners. */
  'challenge:requestPending': () => void;
  'challenge:send': (payload: SendChallengePayload) => void;
  'challenge:accept': (payload: RespondChallengePayload) => void;
  'challenge:decline': (payload: RespondChallengePayload) => void;
  'challenge:cancel': (payload: RespondChallengePayload) => void;
}

//
// ─────────────────────────────────────────────────────────────
// SERVER → CLIENT EVENTS
// ─────────────────────────────────────────────────────────────
//

// Backend now includes the challenged user's username/displayName directly
// on this payload (rather than the frontend having to resolve
// challengedUserId via a separate lookup) — needed so the global challenges
// button in the navbar can render who the outgoing challenge was sent to
// without extra round-trips.
export interface ChallengeSentEvent {
  challengeId: string;
  challengedUserId: string;
  toUsername: string;
  toDisplayName: string;
  preferredColor: PreferredColor;
  expiresAtEpochMs: number;
}

// Backend now includes the challenger's username/displayName directly on
// this payload (rather than the frontend having to resolve fromUserId via a
// separate lookup) — needed so the global incoming-challenges button in the
// navbar can render who each challenge is from without extra round-trips.
export interface ChallengeReceivedEvent {
  challengeId: string;
  fromUserId: string;
  fromUsername: string;
  fromDisplayName: string;
  preferredColor: PreferredColor;
  expiresAtEpochMs: number;
}

export interface ChallengeAcceptedEvent {
  challengeId: string;
  gameId: string;
}

export type ChallengeEndedReason = 'declined' | 'cancelled' | 'overridden' | 'expired';

export interface ChallengeEndedEvent {
  challengeId: string;
  reason: ChallengeEndedReason;
}

export interface ChallengeServerToClientEvents {
  'challenge:sent': (payload: ChallengeSentEvent) => void;
  'challenge:received': (payload: ChallengeReceivedEvent) => void;
  'challenge:accepted': (payload: ChallengeAcceptedEvent) => void;
  'challenge:ended': (payload: ChallengeEndedEvent) => void;
  'challenge:error': (message: string) => void;
}
