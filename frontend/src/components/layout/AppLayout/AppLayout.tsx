import Navbar from '../Navbar';
import type { NavbarProps } from '../Navbar';
import styles from './AppLayout.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppLayoutProps {
  /** Main content of the page */
  children: React.ReactNode;

  /** User passed to Navbar – if undefined, shows guest actions */
  user?: NavbarProps['user'];
  /** Logout handler passed to Navbar */
  onLogout?: NavbarProps['onLogout'];
  /** Loading state passed to Navbar */
  isLoading?: NavbarProps['isLoading'];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppLayout({
  children,
  user,
  onLogout,
  isLoading,
}: AppLayoutProps) {
  return (
    <div className={styles.root}>
      <Navbar user={user} onLogout={onLogout} isLoading={isLoading} />

      <main className={styles.main}>
        <div className={styles.inner}>
          {children}
        </div>
      </main>
    </div>
  );
}