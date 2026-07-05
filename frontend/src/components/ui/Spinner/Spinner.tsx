import styles from './Spinner.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerColor = 'accent' | 'current' | 'muted';

export interface SpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  /** Accessible label for screen readers. Defaults to "Loading…" */
  label?: string;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Spinner({
  size = 'md',
  color = 'accent',
  label = 'Loading…',
  className,
}: SpinnerProps) {
  const classNames = [
    styles.spinner,
    styles[size],
    styles[color],
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classNames}
      role="status"
      aria-label={label}
    >
      {/* Empty — the ring is pure CSS so there is no text node to hide */}
    </span>
  );
}
