import { fetchServerTime } from './time.service';
import { useClockSyncStore } from '@/store/clockSyncStore';

// ─── Tuning constants ───────────────────────────────────────────────────────

/** Number of ping samples collected per sync round. */
const SAMPLES_PER_ROUND = 5;
/** Delay between individual pings within a round, in ms. */
const SAMPLE_SPACING_MS = 150;
/** Samples with RTT above (median RTT * this factor) are discarded as outliers. */
const RTT_OUTLIER_FACTOR = 1.5;
/** Smoothing factor for the EMA across rounds (0-1). Lower = smoother/slower. */
const EMA_ALPHA = 0.25;
/** If a new round's offset differs from the current smoothed offset by more
 *  than this, snap directly instead of smoothing — likely a real clock jump
 *  (sleep/wake, server NTP correction), not measurement noise. */
const SNAP_THRESHOLD_MS = 2000;
/** How often to run a background sync round, in ms. */
const RESYNC_INTERVAL_MS = 90_000;

// ─── Module state ───────────────────────────────────────────────────────────

let smoothedOffset: number | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let started = false;

interface Sample {
  rtt: number;
  offset: number;
}

/** Takes a single ping sample. Returns null if the request failed. */
async function takeSample(): Promise<Sample | null> {
  const t0 = Date.now();
  let serverTime: number;
  try {
    serverTime = await fetchServerTime();
  } catch {
    return null;
  }
  const t3 = Date.now();
  const rtt = t3 - t0;
  const offset = serverTime + rtt / 2 - t3; // NTP-style offset estimate
  return { rtt, offset };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Runs one sync round: takes several samples, filters outliers, derives a
 *  single offset estimate from the lowest-RTT sample, and blends it into
 *  the smoothed offset. */
async function runSyncRound(): Promise<void> {
  const samples: Sample[] = [];

  for (let i = 0; i < SAMPLES_PER_ROUND; i++) {
    const sample = await takeSample();
    if (sample) samples.push(sample);
    if (i < SAMPLES_PER_ROUND - 1) {
      await new Promise((resolve) => setTimeout(resolve, SAMPLE_SPACING_MS));
    }
  }

  if (samples.length === 0) {
    // All pings failed this round — keep the last known good offset.
    return;
  }

  const medianRtt = median(samples.map((s) => s.rtt));
  const lowerBound = medianRtt / RTT_OUTLIER_FACTOR;
    const upperBound = medianRtt * RTT_OUTLIER_FACTOR;

    const filtered = samples.filter(
    (s) => s.rtt >= lowerBound && s.rtt <= upperBound
    );
    const pool = filtered.length > 0 ? filtered : samples;

    const best = pool.reduce((a, b) => (b.rtt < a.rtt ? b : a));

    if (smoothedOffset === null) {
        smoothedOffset = best.offset;
    } else if (Math.abs(best.offset - smoothedOffset) > SNAP_THRESHOLD_MS) {
        smoothedOffset = best.offset;
    } else {
        smoothedOffset = EMA_ALPHA * best.offset + (1 - EMA_ALPHA) * smoothedOffset;
    }

    useClockSyncStore.getState().setOffsetMs(smoothedOffset);
    console.log("clock synced, smoothed offset: ", smoothedOffset)
}

function handleVisibilityChange(): void {
  if (document.visibilityState === 'visible') {
    void runSyncRound();
  }
}

/** Starts the clock sync loop: an immediate round, then periodic background
 *  rounds, plus a re-sync whenever the tab regains visibility (covers
 *  laptop sleep / long-backgrounded tabs where timers get throttled).
 *  Safe to call multiple times — only the first call has any effect. */
export function startClockSync(): void {
  if (started) return;
  started = true;

  void runSyncRound();

  intervalId = setInterval(() => {
    void runSyncRound();
  }, RESYNC_INTERVAL_MS);

  document.addEventListener('visibilitychange', handleVisibilityChange);
}

/** Stops the clock sync loop and resets internal state. Mainly useful for tests. */
export function stopClockSync(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  started = false;
  smoothedOffset = null;
}