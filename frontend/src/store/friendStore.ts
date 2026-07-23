import { create } from 'zustand';

export type FriendNotificationType = 'requestReceived' | 'requestAccepted';

export interface FriendNotification {
  type: FriendNotificationType;
  friendshipId: string;
  fromUsername?: string; // only present on requestReceived
}

interface FriendStore {
  latestNotification: FriendNotification | null;
  error: string | null;

  // Bump these whenever server state changes so list-views know to refetch.
  // TODO: once backend pagination is added, list components should refetch
  // via these version counters rather than holding full lists in this store.
  incomingRequestsVersion: number;
  outgoingRequestsVersion: number;
  friendsVersion: number;

  // Live count of pending incoming requests, kept in sync directly by
  // useFriendSocketEvents (+ the accept/decline actions in useFriends).
  // Unlike the version counters above, this is a real number a badge can
  // render without any component needing to be mounted to refetch a list.
  incomingRequestsCount: number;

  setNotification: (notification: FriendNotification) => void;
  clearNotification: () => void;

  bumpIncomingRequests: () => void;
  bumpOutgoingRequests: () => void;
  bumpFriends: () => void;

  setIncomingRequestsCount: (count: number) => void;
  incrementIncomingRequestsCount: () => void;
  decrementIncomingRequestsCount: () => void;

  setError: (message: string | null) => void;
  reset: () => void;
}

export const useFriendStore = create<FriendStore>((set) => ({
  latestNotification: null,
  error: null,

  incomingRequestsVersion: 0,
  outgoingRequestsVersion: 0,
  friendsVersion: 0,

  incomingRequestsCount: 0,

  setNotification: (notification) => set({ latestNotification: notification }),
  clearNotification: () => set({ latestNotification: null }),

  bumpIncomingRequests: () =>
    set((state) => ({ incomingRequestsVersion: state.incomingRequestsVersion + 1 })),
  bumpOutgoingRequests: () =>
    set((state) => ({ outgoingRequestsVersion: state.outgoingRequestsVersion + 1 })),
  bumpFriends: () =>
    set((state) => ({ friendsVersion: state.friendsVersion + 1 })),

  setIncomingRequestsCount: (count) => set({ incomingRequestsCount: Math.max(0, count) }),
  incrementIncomingRequestsCount: () =>
    set((state) => ({ incomingRequestsCount: state.incomingRequestsCount + 1 })),
  decrementIncomingRequestsCount: () =>
    set((state) => ({ incomingRequestsCount: Math.max(0, state.incomingRequestsCount - 1) })),

  setError: (message) => set({ error: message }),

  reset: () =>
    set({
      latestNotification: null,
      error: null,
      incomingRequestsVersion: 0,
      outgoingRequestsVersion: 0,
      friendsVersion: 0,
      incomingRequestsCount: 0,
    }),
}));

// ─── Selectors ──────────────────────────────────────────────────────────────
export const useLatestFriendNotification = () => useFriendStore((s) => s.latestNotification);
export const useFriendError = () => useFriendStore((s) => s.error);
export const useIncomingRequestsVersion = () => useFriendStore((s) => s.incomingRequestsVersion);
export const useOutgoingRequestsVersion = () => useFriendStore((s) => s.outgoingRequestsVersion);
export const useFriendsVersion = () => useFriendStore((s) => s.friendsVersion);
export const useIncomingRequestsCount = () => useFriendStore((s) => s.incomingRequestsCount);