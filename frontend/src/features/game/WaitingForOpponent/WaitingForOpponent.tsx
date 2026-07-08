// src/features/game/WaitingForOpponent/WaitingForOpponent.tsx
import { useEffect, useState } from 'react';
import { useChallenge } from '@/hooks/useChallenge';
import  Spinner  from '@/components/ui/Spinner';
import  Button  from '@/components/ui/Button';
import styles from './WaitingForOpponent.module.css';

export interface WaitingForOpponentProps {
  className?: string;
}

// Renders nothing if there's no outgoing challenge — safe to always mount
// alongside ChallengeSetupPanel and let it show/hide itself, rather than the
// parent page having to track outgoingChallenge separately to decide which
// of the two to render.
export function WaitingForOpponent({ className }: WaitingForOpponentProps) {
  const { outgoingChallenge, cancelChallenge } = useChallenge();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!outgoingChallenge) {
      setSecondsLeft(null);
      return;
    }

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.round((outgoingChallenge.expiresAtEpochMs - Date.now()) / 1000),
      );
      setSecondsLeft(remaining);
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [outgoingChallenge]);

  if (!outgoingChallenge) return null;

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      <Spinner />
      <p className={styles.text}>Waiting for opponent to respond…</p>
      {secondsLeft !== null && (
        <p className={styles.countdown}>Expires in {secondsLeft}s</p>
      )}
      <Button variant="secondary" onClick={cancelChallenge}>
        Cancel
      </Button>
    </div>
  );
}