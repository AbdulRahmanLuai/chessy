// src/features/profile/ProfileHeader/ProfileHeader.tsx
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import type { PublicProfile } from '@/types';
import type { ProfileStats } from '@/hooks/useProfile';
import styles from './ProfileHeader.module.css';

export interface ProfileHeaderProps {
  user: PublicProfile;
  stats: ProfileStats;
  className?: string;
}

export function ProfileHeader({
  user,
  stats,
  className,
}: ProfileHeaderProps) {
  const joined = new Date(user.createdAt).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className={`${styles.header} ${className ?? ''}`}>
      <Avatar username={user.displayName} size="xl" ring />

      <div className={styles.info}>
        <h1 className={styles.displayName}>{user.displayName}</h1>
        <span className={styles.username}>@{user.username}</span>
        <span className={styles.joined}>Joined {joined}</span>
      </div>

      <div className={styles.stats}>
        <Badge variant="default">{stats.total} games</Badge>
        <Badge variant="success">{stats.wins}W</Badge>
        <Badge variant="danger">{stats.losses}L</Badge>
        <Badge variant="warning">{stats.draws}D</Badge>
      </div>
    </div>
  );
}