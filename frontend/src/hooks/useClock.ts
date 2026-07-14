import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useClockSyncStore } from '../store/clockSyncStore';
import { getActiveColor } from '../utils/turn';
import type { Color } from '../types';

const TICK_MS = 100; // coupled to Clock.tsx's CRIT_TIME_THRESHOLD_MS tenths display — don't change independently

/**
 * Returns a live-ticking, server-authoritative remaining-time value (ms) for one color.
 * - Only runs an interval while it's this color's turn in an in-progress game;
 *   the idle color just mirrors the server snapshot with no interval.
 * - Recomputes displayMs from scratch every tick (anchor + base remaining),
 *   never decrements cumulatively, so throttled/missed ticks don't cause drift.
 * - Never declares a timeout itself: freezes at 0 and waits for the server's
 *   setResult to end the game.
 */
export function useClock(color: Color): number {
  const status = useGameStore((s) => s.game?.status);
  const currentFen = useGameStore((s) => s.game?.currentFen);
  const baseRemainingMs = useGameStore((s) =>
    color === 'white' ? s.game?.whiteTimeRemainingMs : s.game?.blackTimeRemainingMs
  );
  // Clock starts ticking on game creation now (challenge acceptance), not on White's first move.
  const anchorTimestamp = useGameStore((s) => s.game?.lastMoveAt ?? s.game?.createdAt);
  const offsetMs = useClockSyncStore((s) => s.offsetMs);

  const activeColor = currentFen ? getActiveColor(currentFen) : null;
  const isActive = status === 'IN_PROGRESS' && activeColor === color;

  const [displayMs, setDisplayMs] = useState(baseRemainingMs ?? 0);

  useEffect(() => {
    if (baseRemainingMs == null) return;

    if (!isActive || !anchorTimestamp) {
      // Idle color, or no anchor yet: just mirror the server value, no interval.
      setDisplayMs(baseRemainingMs);
      return;
    }

    const anchorMs = new Date(anchorTimestamp).getTime();

    const tick = () => {
      const now = Date.now() + offsetMs;
      const elapsed = now - anchorMs;
      const next = baseRemainingMs - Math.max(0, elapsed);;
      setDisplayMs(Math.max(0, next));
    };

    tick();
    const intervalId = setInterval(tick, TICK_MS);
    return () => clearInterval(intervalId);
  }, [isActive, anchorTimestamp, baseRemainingMs, offsetMs]);

  return displayMs;
}