import { useEffect, useState } from 'react';
import { useClockSyncStore } from '../store/clockSyncStore';

const TICK_MS = 100; // coupled to Clock.tsx's CRIT_TIME_THRESHOLD_MS tenths display — don't change independently

interface UseClockParams {
  /** Server-authoritative remaining time snapshot for this color, in ms. */
  baseRemainingMs: number | null | undefined;
  /** Timestamp the current remaining-time snapshot is anchored to (last move, or game creation). */
  anchorTimestamp: string | null | undefined;
  /** Whether it is currently this color's turn in an in-progress game. */
  isActive: boolean;
}

/**
 * Returns a live-ticking, server-authoritative remaining-time value (ms) for one color.
 * Store-agnostic: caller supplies the snapshot + anchor, so this works for both
 * online games and computer games without knowing which store they come from.
 * - Only runs an interval while `isActive` is true; the idle color just mirrors
 *   the server snapshot with no interval.
 * - Recomputes displayMs from scratch every tick (anchor + base remaining),
 *   never decrements cumulatively, so throttled/missed ticks don't cause drift.
 * - Never declares a timeout itself: freezes at 0 and waits for the server's
 *   setResult to end the game.
 */
export function useClock({ baseRemainingMs, anchorTimestamp, isActive }: UseClockParams): number {
  const offsetMs = useClockSyncStore((s) => s.offsetMs);

  const [displayMs, setDisplayMs] = useState(baseRemainingMs ?? 0);

  useEffect(() => {
    if (baseRemainingMs == null) return;

    console.log('useClock: baseRemainingMs', baseRemainingMs, 'anchorTimestamp', anchorTimestamp, 'isActive', isActive, 'offsetMs', offsetMs);

    if (!isActive || !anchorTimestamp) {
      // Idle color, or no anchor yet: just mirror the server value, no interval.
      setDisplayMs(baseRemainingMs);
      return;
    }

    const anchorMs = new Date(anchorTimestamp).getTime();

    const tick = () => {
      const now = Date.now() + offsetMs;
      const elapsed = now - anchorMs;
      const next = baseRemainingMs - Math.max(0, elapsed);
      setDisplayMs(Math.max(0, next));
    };

    tick();
    const intervalId = setInterval(tick, TICK_MS);
    return () => clearInterval(intervalId);
  }, [isActive, anchorTimestamp, baseRemainingMs, offsetMs]);

  return displayMs;
}