import styles from './Clock.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const LOW_TIME_THRESHOLD_MS  = 30_000;  // 30 seconds — warning state
const CRIT_TIME_THRESHOLD_MS = 10_000;  // 10 seconds — danger state

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats milliseconds into a display string.
 *   ≥ 1 hour  →  h:mm:ss   (e.g. "1:02:34")
 *   < 1 hour  →  mm:ss     (e.g. "04:37")
 *   < 10 secs →  s.t       (e.g. "9.4"  — shows tenths)
 */
function formatMs(ms: number): string {
  if (ms <= 0) return '0:00';

  const totalSeconds = Math.floor(ms / 1000);
  const hours        = Math.floor(totalSeconds / 3600);
  const minutes      = Math.floor((totalSeconds % 3600) / 60);
  const seconds      = totalSeconds % 60;

  // Show tenths of a second when critically low
  if (ms < CRIT_TIME_THRESHOLD_MS) {
    const tenths = Math.floor((ms % 1000) / 100);
    return `${seconds}.${tenths}`;
  }

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClockProps {
  /** Time remaining in milliseconds */
  timeRemainingMs: number;
  /** Whether this clock is currently counting down */
  isActive: boolean;
  /** Accessible label for screen readers, e.g. "White's clock" */
  label?: string;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Clock({
  timeRemainingMs,
  isActive,
  label = 'Clock',
  className,
}: ClockProps) {
  const isLow  = timeRemainingMs > 0 && timeRemainingMs <= LOW_TIME_THRESHOLD_MS;
  const isCrit = timeRemainingMs > 0 && timeRemainingMs <= CRIT_TIME_THRESHOLD_MS;
  const isOut  = timeRemainingMs <= 0;

  const classNames = [
    styles.clock,
    isActive  ? styles.active  : styles.idle,
    isLow  && !isCrit ? styles.low  : '',
    isCrit    ? styles.crit   : '',
    isOut     ? styles.out    : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      role="timer"
      aria-label={`${label}: ${formatMs(timeRemainingMs)}`}
      aria-live={isCrit ? 'assertive' : isLow ? 'polite' : 'off'}
    >
      <span className={styles.display} aria-hidden="true">
        {formatMs(timeRemainingMs)}
      </span>
    </div>
  );
}
