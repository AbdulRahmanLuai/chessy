import { create } from 'zustand';

interface ClockSyncStore {
  /**
   * Estimated offset in ms: serverNow - clientNow.
   * Defaults to 0 (client clock trusted as-is). Currently unused/unset —
   * no ping/pong mechanism exists yet. When one is added, it should call
   * setOffsetMs() periodically with a fresh estimate; useClock already
   * reads this value on every tick, so no changes to useClock will be
   * needed when sync is wired up.
   */
  offsetMs: number;
  setOffsetMs: (offsetMs: number) => void;
}

export const useClockSyncStore = create<ClockSyncStore>((set) => ({
  offsetMs: 0,
  setOffsetMs: (offsetMs) => set({ offsetMs }),
}));