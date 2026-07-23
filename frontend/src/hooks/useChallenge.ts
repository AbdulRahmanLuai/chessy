// src/hooks/useChallenge.ts
import { useCallback } from 'react';
import { challengeSocketService } from '@/socket/challengeSocketService';
import {
  useChallengeStore,
  useOutgoingChallenge,
  useIncomingChallenges,
  useChallengeError,
} from '@/store/challengeStore';
import type { PreferredColor } from '@/socket/events';

interface UseChallengeReturn {
  outgoingChallenge: ReturnType<typeof useOutgoingChallenge>;
  incomingChallenges: ReturnType<typeof useIncomingChallenges>;
  error: string | null;
  acceptedGameId: string | null;

  sendChallenge: (
    challengedUserId: string,
    timeLimitSeconds: number,
    incrementSeconds?: number,
    preferredColor?: PreferredColor
  ) => void;

  acceptChallenge: (challengeId: string) => void;
  declineChallenge: (challengeId: string) => void;
  cancelChallenge: () => void;
  clearAcceptedGameId: () => void;
}

// ─── Reads + actions — calls service directly, no socket listeners ─────────
//
// Socket events are handled exclusively by useChallengeSocketEvents, mounted
// once in AppLayout. This hook can be safely used by any number of
// components (ChallengesButton, ToastContainer, etc.) without registering
// duplicate listeners or emitting redundant challenge:requestPending calls.
export function useChallenge(): UseChallengeReturn {
  const outgoingChallenge = useOutgoingChallenge();
  const incomingChallenges = useIncomingChallenges();
  const error = useChallengeError();
  const acceptedGameId = useChallengeStore((s) => s.acceptedGameId);

  const removeIncomingChallenge = useChallengeStore((s) => s.removeIncomingChallenge);
  const clearOutgoingChallenge = useChallengeStore((s) => s.clearOutgoingChallenge);
  const clearAcceptedGameId = useChallengeStore((s) => s.clearAcceptedGameId);

  const sendChallenge = useCallback(
    (
      challengedUserId: string,
      timeLimitSeconds: number,
      incrementSeconds = 0,
      preferredColor: PreferredColor = 'RANDOM'
    ) => {
      challengeSocketService.send(
        challengedUserId,
        timeLimitSeconds,
        incrementSeconds,
        preferredColor
      );
    },
    []
  );

  const acceptChallenge = useCallback((challengeId: string) => {
    challengeSocketService.accept(challengeId);
  }, []);

  const declineChallenge = useCallback(
    (challengeId: string) => {
      challengeSocketService.decline(challengeId);
      removeIncomingChallenge(challengeId);
    },
    [removeIncomingChallenge]
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