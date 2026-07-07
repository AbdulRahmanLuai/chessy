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

  setNotification: (notification: FriendNotification) => void;
  clearNotification: () => void;

  bumpIncomingRequests: () => void;
  bumpOutgoingRequests: () => void;
  bumpFriends: () => void;

  setError: (message: string | null) => void;
  reset: () => void;
}

export const useFriendStore = create<FriendStore>((set) => ({
  latestNotification: null,
  error: null,

  incomingRequestsVersion: 0,
  outgoingRequestsVersion: 0,
  friendsVersion: 0,

  setNotification: (notification) => set({ latestNotification: notification }),
  clearNotification: () => set({ latestNotification: null }),

  bumpIncomingRequests: () =>
    set((state) => ({ incomingRequestsVersion: state.incomingRequestsVersion + 1 })),
  bumpOutgoingRequests: () =>
    set((state) => ({ outgoingRequestsVersion: state.outgoingRequestsVersion + 1 })),
  bumpFriends: () =>
    set((state) => ({ friendsVersion: state.friendsVersion + 1 })),

  setError: (message) => set({ error: message }),

  reset: () =>
    set({
      latestNotification: null,
      error: null,
      incomingRequestsVersion: 0,
      outgoingRequestsVersion: 0,
      friendsVersion: 0,
    }),
}));

// ─── Selectors ──────────────────────────────────────────────────────────────
export const useLatestFriendNotification = () => useFriendStore((s) => s.latestNotification);
export const useFriendError = () => useFriendStore((s) => s.error);
export const useIncomingRequestsVersion = () => useFriendStore((s) => s.incomingRequestsVersion);
export const useOutgoingRequestsVersion = () => useFriendStore((s) => s.outgoingRequestsVersion);
export const useFriendsVersion = () => useFriendStore((s) => s.friendsVersion);