import { emitWhenReady } from './socket';
import type {
  SendChallengePayload,
  RespondChallengePayload,
  PreferredColor,
} from './events';

function send(
  challengedUserId: string,
  timeLimitSeconds: number,
  incrementSeconds = 0,
  preferredColor: PreferredColor = 'RANDOM'
) {
  const payload: SendChallengePayload = {
    challengedUserId,
    timeLimitSeconds,
    incrementSeconds,
    preferredColor,

  };

  emitWhenReady('challenge:send', payload);
}

function accept(challengeId: string) {
  const payload: RespondChallengePayload = { challengeId };
  emitWhenReady('challenge:accept', payload);
}

function decline(challengeId: string) {
  const payload: RespondChallengePayload = { challengeId };
  emitWhenReady('challenge:decline', payload);
}

function cancel(challengeId: string) {
  const payload: RespondChallengePayload = { challengeId };
  emitWhenReady('challenge:cancel', payload);
}

export const challengeSocketService = {
  send,
  accept,
  decline,
  cancel,
};