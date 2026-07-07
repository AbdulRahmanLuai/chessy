import { getSocket } from './socket';
import type { SendChallengePayload, RespondChallengePayload, PreferredColor } from './events';

function send(challengedUserId: string, preferredColor: PreferredColor = 'RANDOM') {
  const socket = getSocket();
  if (!socket) return;

  const payload: SendChallengePayload = { challengedUserId, preferredColor };
  socket.emit('challenge:send', payload);
}

function accept(challengeId: string) {
  const socket = getSocket();
  if (!socket) return;

  const payload: RespondChallengePayload = { challengeId };
  socket.emit('challenge:accept', payload);
}

function decline(challengeId: string) {
  const socket = getSocket();
  if (!socket) return;

  const payload: RespondChallengePayload = { challengeId };
  socket.emit('challenge:decline', payload);
}

function cancel(challengeId: string) {
  const socket = getSocket();
  if (!socket) return;

  const payload: RespondChallengePayload = { challengeId };
  socket.emit('challenge:cancel', payload);
}

export const challengeSocketService = {
  send,
  accept,
  decline,
  cancel,
};