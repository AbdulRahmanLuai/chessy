import { Link } from 'react-router-dom';
import styles from './AuthLayout.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthLayoutProps {
  /** Page title rendered above the card (e.g. "Welcome back") */
  title: string;
  /** Subtitle rendered below the title */
  subtitle?: string;
  /** Footer row rendered below the card (e.g. "Don't have an account? Sign up") */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuthLayout({
  title,
  subtitle,
  footer,
  children,
}: AuthLayoutProps) {
  return (
    <div className={styles.root}>
      {/* ── Background board pattern ──────────────────────────────────── */}
      <div className={styles.bgPattern} aria-hidden="true" />

      <div className={styles.inner}>
        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <Link to="/" className={styles.logoLink} aria-label="Chessy home">
          <span className={styles.logoIcon} aria-hidden="true">♟</span>
          <span className={styles.logoText}>Chessy</span>
        </Link>

        {/* ── Card ──────────────────────────────────────────────────────── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.title}>{title}</h1>
            {subtitle && (
              <p className={styles.subtitle}>{subtitle}</p>
            )}
          </div>

          <div className={styles.cardBody}>
            {children}
          </div>
        </div>

        {/* ── Footer link (e.g. switch between login / register) ─────────── */}
        {footer && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
