// src/hooks/useChallenge.ts
import { useEffect, useCallback } from 'react';
import { getSocket, onSocketReady } from '@/socket/socket';
import { challengeSocketService } from '@/socket/challengeSocketService';
import { useNotificationStore } from '@/store/notificationStore';
import {
  useChallengeStore,
  useOutgoingChallenge,
  useIncomingChallenges,
  useChallengeError,
} from '@/store/challengeStore';
import type {
  ChallengeSentEvent,
  ChallengeReceivedEvent,
  ChallengeAcceptedEvent,
  ChallengeEndedEvent,
  PreferredColor,
} from '@/socket/events';

interface UseChallengeReturn {
  outgoingChallenge: ReturnType<typeof useOutgoingChallenge>;
  incomingChallenges: ReturnType<typeof useIncomingChallenges>;
  error: string | null;
  acceptedGameId: string | null;

  sendChallenge: (challengedUserId: string, preferredColor?: PreferredColor) => void;
  acceptChallenge: (challengeId: string) => void;
  declineChallenge: (challengeId: string) => void;
  cancelChallenge: () => void;
  clearAcceptedGameId: () => void;
}

export function useChallenge(): UseChallengeReturn {
  const outgoingChallenge = useOutgoingChallenge();
  const incomingChallenges = useIncomingChallenges();
  const error = useChallengeError();
  const acceptedGameId = useChallengeStore((s) => s.acceptedGameId);

  const setOutgoingChallenge = useChallengeStore((s) => s.setOutgoingChallenge);
  const clearOutgoingChallenge = useChallengeStore((s) => s.clearOutgoingChallenge);
  const addIncomingChallenge = useChallengeStore((s) => s.addIncomingChallenge);
  const removeIncomingChallenge = useChallengeStore((s) => s.removeIncomingChallenge);
  const setAcceptedGameId = useChallengeStore((s) => s.setAcceptedGameId);
  const clearAcceptedGameId = useChallengeStore((s) => s.clearAcceptedGameId);
  const setError = useChallengeStore((s) => s.setError);
  const pushToast = useNotificationStore((s) => s.push);

  // ─── Socket event listeners ────────────────────────────────────────────────

  useEffect(() => {
    let cleanupListeners: (() => void) | null = null;

    const setupListeners = () => {
      const socket = getSocket();
      if (!socket) return; // defensive; shouldn't happen once called from onSocketReady

      const onChallengeSent = (payload: ChallengeSentEvent) => {
        setOutgoingChallenge(payload);
      };
      const onChallengeReceived = (payload: ChallengeReceivedEvent) => {
        console.log('Received challenge:', payload);
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

      cleanupListeners = () => {
        socket.off('challenge:sent', onChallengeSent);
        socket.off('challenge:received', onChallengeReceived);
        socket.off('challenge:accepted', onChallengeAccepted);
        socket.off('challenge:ended', onChallengeEnded);
        socket.off('challenge:error', onChallengeError);
      };
    };

    let unsubscribeReady: (() => void) | null = null;

    
    unsubscribeReady = onSocketReady(setupListeners); // call back to remove setupListeners callback from queue in socket.ts on unmount
    

    return () => {
      unsubscribeReady?.();
      cleanupListeners?.();
    };
  }, [
    setOutgoingChallenge,
    addIncomingChallenge,
    clearOutgoingChallenge,
    removeIncomingChallenge,
    setAcceptedGameId,
    setError,
    pushToast,
  ]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const sendChallenge = useCallback((challengedUserId: string, preferredColor: PreferredColor = 'RANDOM') => {
    challengeSocketService.send(challengedUserId, preferredColor);
  }, []);

  const acceptChallenge = useCallback((challengeId: string) => {
    challengeSocketService.accept(challengeId);
  }, []);

  const declineChallenge = useCallback(
    (challengeId: string) => {
      challengeSocketService.decline(challengeId);
      removeIncomingChallenge(challengeId);
    },
    [removeIncomingChallenge],
  );

  const cancelChallenge = useCallback(() => {
    if (!outgoingChallenge) return;
    challengeSocketService.cancel(outgoingChallenge.challengeId);
    clearOutgoingChallenge();
  }, [outgoingChallenge, clearOutgoingChallenge]);

  return {
    outgoingChallenge,
    incomingChallenges,
    error,
    acceptedGameId,
    sendChallenge,
    acceptChallenge,
    declineChallenge,
    cancelChallenge,
    clearAcceptedGameId,
  };
}