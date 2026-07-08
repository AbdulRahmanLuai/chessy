// src/features/challenge/IncomingChallengesButton/IncomingChallengesButton.tsx
import { useState } from 'react';
import { useChallenge } from '@/hooks/useChallenge';
import  Badge  from '@/components/ui/Badge';
import  Button  from '@/components/ui/Button';
import styles from './IncomingChallengesButton.module.css';

export interface IncomingChallengesButtonProps {
  className?: string;
}

// Global entry point (lives in Navbar) for incoming challenges — deliberately
// does NOT navigate on accept. Navigation on challenge:accepted is handled
// once, globally, by useAcceptedChallengeRedirect in AppLayout, since this
// button and WaitingForOpponent are both mounted at all times.
export function IncomingChallengesButton({ className }: IncomingChallengesButtonProps) {
  const { incomingChallenges, acceptChallenge, declineChallenge } = useChallenge();
  const [isOpen, setIsOpen] = useState(false);

  const challenges = Object.values(incomingChallenges);
  const count = challenges.length;

  if (count === 0) {
    return null;
  }

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        Challenges
        <Badge count={count} />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <ul className={styles.list}>
            {challenges.map((challenge) => (
              <li key={challenge.challengeId} className={styles.item}>
                <div className={styles.itemInfo}>
                  <span className={styles.displayName}>{challenge.fromDisplayName}</span>
                  <span className={styles.username}>@{challenge.fromUsername}</span>
                  <span className={styles.colorNote}>
                    You'd play as{' '}
                    {challenge.preferredColor === 'RANDOM' ? 'random' : challenge.preferredColor.toLowerCase()}
                  </span>
                </div>
                <div className={styles.itemActions}>
                  <Button variant="primary" onClick={() => acceptChallenge(challenge.challengeId)}>
                    Accept
                  </Button>
                  <Button variant="secondary" onClick={() => declineChallenge(challenge.challengeId)}>
                    Decline
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}