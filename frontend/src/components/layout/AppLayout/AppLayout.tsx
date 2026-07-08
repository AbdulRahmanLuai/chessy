// src/components/layout/AppLayout/AppLayout.tsx

import { useAcceptedChallengeRedirect } from '@/hooks/useAcceptedChallengeRedirect';
import Navbar from '../Navbar';
import { WaitingForOpponent }from '@/features/game/WaitingForOpponent';
import type { NavbarProps } from '../Navbar';
import styles from './AppLayout.module.css';
import ToastContainer from '../ToastContainer';

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

export default function AppLayout({
  children,
  user,
  onLogout,
  isLoading,
}: AppLayoutProps) {
  // Global listener: whenever a challenge is accepted,
  // navigate to the game.
  useAcceptedChallengeRedirect();

  return (
    <div className={styles.root}>
      <Navbar
        user={user}
        onLogout={onLogout}
        isLoading={isLoading}
      />

      {/* Mounted globally so challenges sent from anywhere
          (e.g. Friends dropdown) still show waiting state. */}
      <WaitingForOpponent />
      <ToastContainer />

      <main className={styles.main}>
        <div className={styles.inner}>
          {children}
        </div>
      </main>
    </div>
  );
}