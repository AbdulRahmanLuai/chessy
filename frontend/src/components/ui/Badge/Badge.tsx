import styles from './Badge.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeVariant =
  | 'default'
  | 'accent'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Renders a small colored dot before the label */
  dot?: boolean;
  /** Icon rendered before the label (and after the dot if both are set) */
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  className,
  children,
}: BadgeProps) {
  const classNames = [
    styles.badge,
    styles[variant],
    styles[size],
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classNames}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
