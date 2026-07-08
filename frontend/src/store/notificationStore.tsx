// src/store/notificationStore.ts
import { create } from 'zustand';

// ─── Types ──────────────────────────────────────────────────────────────────
// This store is purely presentational — it does NOT duplicate domain state
// already owned by challengeStore/friendStore. Each toast variant carries
// only what Toast needs to render + the domain id needed to act on it
// (accept/decline, open popover, etc). Extend this union when new
// toast-worthy events are added (e.g. game:drawOffered).

export interface ChallengeToast {
  id: string;
  createdAt: number;
  kind: 'challenge';
  challengeId: string;
  fromUsername: string;
  fromDisplayName: string;
}

export interface FriendRequestToast {
  id: string;
  createdAt: number;
  kind: 'friendRequest';
  friendshipId: string;
  fromUsername: string;
}

export type ToastNotification = ChallengeToast | FriendRequestToast;

export type NewToast =
  | Omit<ChallengeToast, 'id' | 'createdAt'>
  | Omit<FriendRequestToast, 'id' | 'createdAt'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ToastIdentity =
  | { kind: 'challenge'; challengeId: string }
  | { kind: 'friendRequest'; friendshipId: string };

function domainId(toast: ToastIdentity): string {
  return toast.kind === 'challenge' ? toast.challengeId : toast.friendshipId;
}

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `toast-${Date.now()}-${idCounter}`;
}

// ─── Store ──────────────────────────────────────────────────────────────────

interface NotificationStore {
  toasts: ToastNotification[];

  /**
   * Adds a toast. If one already exists for the same domain entity
   * (same `kind` + same challengeId/friendshipId), the push is skipped
   * rather than duplicated — guards against duplicate socket emissions
   * producing duplicate toasts.
   */
  push: (toast: NewToast) => void;

  /**
   * Removes a toast by id. Called on manual close (X button), auto-dismiss
   * timeout, or after the toast's action (accept/decline) has been taken.
   */
  dismiss: (id: string) => void;

  /** Clears all toasts — useful on logout. */
  clear: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  toasts: [],

  push: (toast) => {
    const alreadyExists = get().toasts.some(
      (t) => t.kind === toast.kind && domainId(t) === domainId(toast),
    );
    if (alreadyExists) return;

    const newToast = {
      ...toast,
      id: nextId(),
      createdAt: Date.now(),
    } as ToastNotification;

    set((state) => ({ toasts: [...state.toasts, newToast] }));
  },

  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  clear: () => set({ toasts: [] }),
}));

// ─── Selectors ──────────────────────────────────────────────────────────────
export const useToasts = () => useNotificationStore((s) => s.toasts);