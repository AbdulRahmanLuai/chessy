import { useState } from 'react';
import { Users, Clock, UserPlus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from './ChallengeFriendCard.module.css';

type TimeControl = 'bullet' | 'blitz' | 'rapid';

export default function ChallengeFriendCard() {
  const [friendIdentifier, setFriendIdentifier] = useState('');
  const [timeControl, setTimeControl] = useState<TimeControl>('blitz');

  const handleChallenge = () => {
    // TODO: Create friend challenge
    console.log('Challenge friend', { friendIdentifier, timeControl });
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Users size={24} className={styles.icon} />
        <h2 className={styles.heading}>Challenge Friend</h2>
      </div>
      <p className={styles.description}>
        Invite a friend to a game by username or email.
      </p>

      <div className={styles.section}>
        <label htmlFor="friendInput" className={styles.label}>
          Username or email
        </label>
        <div className={styles.inputWrapper}>
          <UserPlus size={18} className={styles.inputIcon} />
          <Input
            id="friendInput"
            placeholder="e.g. grandmaster2026"
            value={friendIdentifier}
            onChange={(e) => setFriendIdentifier(e.target.value)}
            fullWidth
          />
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Time Control</label>
        <div className={styles.buttonGroup}>
          {(['bullet', 'blitz', 'rapid'] as TimeControl[]).map((tc) => (
            <button
              key={tc}
              className={`${styles.optionButton} ${timeControl === tc ? styles.active : ''}`}
              onClick={() => setTimeControl(tc)}
            >
              {tc.charAt(0).toUpperCase() + tc.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <Button
        variant="primary"
        fullWidth
        onClick={handleChallenge}
        disabled={!friendIdentifier.trim()}
        className={styles.challengeButton}
      >
        Challenge
      </Button>
    </div>
  );
}