//
// ─────────────────────────────────────────────────────────────
// CLIENT → SERVER EVENTS
// ─────────────────────────────────────────────────────────────
//

export type PreferredColor = 'WHITE' | 'BLACK' | 'RANDOM';

export interface SendChallengePayload {
  challengedUserId: string;
  preferredColor: PreferredColor;
}

export interface RespondChallengePayload {
  challengeId: string;
}

export interface ChallengeClientToServerEvents {
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

export interface ChallengeSentEvent {
  challengeId: string;
  challengedUserId: string;
  preferredColor: PreferredColor;
  expiresAtEpochMs: number;
}

export interface ChallengeReceivedEvent {
  challengeId: string;
  fromUserId: string;
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