// src/features/lobby/PlayOnlineCard/PlayOnlineCard.tsx
import { useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import  Button  from '@/components/ui/Button';
import styles from './PlayOnlineCard.module.css';

export interface PlayOnlineCardProps {
  className?: string;
}

// Replaces the stale ChallengeFriendCard — that card collected a raw
// username/email string and had a non-functional time control selector with
// no real challenge flow behind it. This one just routes into /play-online,
// where ChallengeSetupPanel (friend-picker + username-search + real
// preferredColor wiring) lives instead.
export function PlayOnlineCard({ className }: PlayOnlineCardProps) {
  const navigate = useNavigate();

  return (
    <div className={`${styles.card} ${className ?? ''}`}>
      <Globe size={32} className={styles.icon} aria-hidden="true" />
      <h3 className={styles.title}>Play Online</h3>
      <p className={styles.description}>
        Challenge a friend or find an opponent by username.
      </p>
      <Button variant="primary" onClick={() => navigate('/play-online')}>
        Play Online
      </Button>
    </div>
  );
}