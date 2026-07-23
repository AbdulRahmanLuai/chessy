// src/hooks/useChallengeSocketEvents.ts
import { useEffect } from 'react';
import { getSocket, onSocketReady } from '@/socket/socket';
import { useNotificationStore } from '@/store/notificationStore';
import { useChallengeStore } from '@/store/challengeStore';
import type {
  ChallengeSentEvent,
  ChallengeReceivedEvent,
  ChallengeAcceptedEvent,
  ChallengeEndedEvent,
} from '@/socket/events';

/**
 * Keeps challenge socket state and notifications in sync independently of
 * ChallengesButton/ToastContainer, which may mount/unmount or re-render
 * without needing to own the socket subscription themselves.
 *
 * Mounted once, globally, in AppLayout — see useFriendSocketEvents for the
 * equivalent pattern on the friends side.
 */
export function useChallengeSocketEvents(): void {
  const setOutgoingChallenge = useChallengeStore((s) => s.setOutgoingChallenge);
  const clearOutgoingChallenge = useChallengeStore((s) => s.clearOutgoingChallenge);
  const addIncomingChallenge = useChallengeStore((s) => s.addIncomingChallenge);
  const removeIncomingChallenge = useChallengeStore((s) => s.removeIncomingChallenge);
  const setAcceptedGameId = useChallengeStore((s) => s.setAcceptedGameId);
  const setError = useChallengeStore((s) => s.setError);
  const pushToast = useNotificationStore((s) => s.push);

  useEffect(() => {
    let cleanupListeners: (() => void) | null = null;

    const setupListeners = () => {
      const socket = getSocket();
      if (!socket) return;

      const onChallengeSent = (payload: ChallengeSentEvent) => {
        setOutgoingChallenge(payload);
      };

      const onChallengeReceived = (payload: ChallengeReceivedEvent) => {
        addIncomingChallenge(payload);
        pushToast({
          kind: 'challenge',
          challengeId: payload.challengeId,
          fromUsername: payload.fromUsername,
          fromDisplayName: payload.fromDisplayName,
        });
      };

      const onChallengeAccepted = (payload: ChallengeAcceptedEvent) => {
        clearOutgoingChallenge();
        removeIncomingChallenge(payload.challengeId);
        setAcceptedGameId(payload.gameId);
      };

      const onChallengeEnded = (payload: ChallengeEndedEvent) => {
        clearOutgoingChallenge();
        removeIncomingChallenge(payload.challengeId);
      };

      const onChallengeError = (message: string) => {
        setError(message);
      };

      socket.on('challenge:sent', onChallengeSent);
      socket.on('challenge:received', onChallengeReceived);
      socket.on('challenge:accepted', onChallengeAccepted);
      socket.on('challenge:ended', onChallengeEnded);
      socket.on('challenge:error', onChallengeError);

      // Pending challenges are requested only after the handlers above are
      // registered, preventing the authentication-time replay from being lost.
      socket.emit('challenge:requestPending');

      cleanupListeners = () => {
        socket.off('challenge:sent', onChallengeSent);
        socket.off('challenge:received', onChallengeReceived);
        socket.off('challenge:accepted', onChallengeAccepted);
        socket.off('challenge:ended', onChallengeEnded);
        socket.off('challenge:error', onChallengeError);
      };
    };

    const unsubscribeReady = onSocketReady(setupListeners);

    return () => {
      unsubscribeReady?.();
      cleanupListeners?.();
    };
  }, [
    setOutgoingChallenge,
    clearOutgoingChallenge,
    addIncomingChallenge,
    removeIncomingChallenge,
    setAcceptedGameId,
    setError,
    pushToast,
  ]);
}