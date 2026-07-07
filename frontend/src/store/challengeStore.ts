import { create } from 'zustand';
import { PreferredColor } from '@/socket/events';

export interface OutgoingChallenge {
  challengeId: string;
  challengedUserId: string;
  expiresAtEpochMs: number;
  preferredColor: PreferredColor;
}

export interface IncomingChallenge {
  challengeId: string;
  fromUserId: string;
  expiresAtEpochMs: number;
  preferredColor: PreferredColor;

}

interface ChallengeStore {
  outgoingChallenge: OutgoingChallenge | null;
  incomingChallenges: Record<string, IncomingChallenge>;
  error: string | null;

  setOutgoingChallenge: (challenge: OutgoingChallenge | null) => void;
  clearOutgoingChallenge: () => void;

  addIncomingChallenge: (challenge: IncomingChallenge) => void;
  removeIncomingChallenge: (challengeId: string) => void;

  acceptedGameId: string | null;
  setAcceptedGameId: (gameId: string | null) => void;
  clearAcceptedGameId: () => void;

  setError: (message: string | null) => void;

  reset: () => void;
}

export const useChallengeStore = create<ChallengeStore>((set) => ({
  outgoingChallenge: null,
  incomingChallenges: {},
  error: null,

  setOutgoingChallenge: (challenge) => set({ outgoingChallenge: challenge }),
  clearOutgoingChallenge: () => set({ outgoingChallenge: null }),

  addIncomingChallenge: (challenge) =>
    set((state) => ({
      incomingChallenges: {
        ...state.incomingChallenges,
        [challenge.challengeId]: challenge,
      },
    })),

  removeIncomingChallenge: (challengeId) =>
    set((state) => {
      const next = { ...state.incomingChallenges };
      delete next[challengeId];
      return { incomingChallenges: next };
    }),

    acceptedGameId: null,
    setAcceptedGameId: (gameId) => set({ acceptedGameId: gameId }),
    clearAcceptedGameId: () => set({ acceptedGameId: null }),

  setError: (message) => set({ error: message }),

  reset: () =>
    set({
      outgoingChallenge: null,
      incomingChallenges: {},
      error: null,
    }),
}));

// ─── Selectors ──────────────────────────────────────────────────────────────
export const useOutgoingChallenge = () => useChallengeStore((s) => s.outgoingChallenge);
export const useIncomingChallenges = () => useChallengeStore((s) => s.incomingChallenges);
export const useChallengeError = () => useChallengeStore((s) => s.error);