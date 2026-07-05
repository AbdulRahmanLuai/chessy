import { useState } from 'react';
import { User } from 'lucide-react';
import styles from './Avatar.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  /** URL of the avatar image */
  src?: string | null;
  /** User's display name — used to derive initials and as alt text */
  username?: string;
  size?: AvatarSize;
  /** Shows a colored dot indicating online presence */
  showStatus?: boolean;
  isOnline?: boolean;
  /** Renders a gold ring around the avatar (e.g. active player's turn) */
  ring?: boolean;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns up to two uppercase initials from a display name */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Deterministically picks one of several muted bg hues from the username */
function getInitialsBg(username: string): string {
  const hues = [210, 160, 280, 30, 340, 190];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hues[Math.abs(hash) % hues.length];
  return `hsl(${hue}, 25%, 28%)`;
}

// ─── Icon sizes mapped to AvatarSize ─────────────────────────────────────────

const iconSizeMap: Record<AvatarSize, number> = {
  xs: 10,
  sm: 14,
  md: 18,
  lg: 24,
  xl: 32,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Avatar({
  src,
  username,
  size = 'md',
  showStatus = false,
  isOnline = false,
  ring = false,
  className,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const showImage = src && !imgError;
  const showInitials = !showImage && username;
  const showFallbackIcon = !showImage && !username;

  const containerClass = [
    styles.container,
    styles[size],
    ring ? styles.ring : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const bgStyle = showInitials
    ? { backgroundColor: getInitialsBg(username) }
    : undefined;

  return (
    <span className={containerClass} style={bgStyle}>
      {showImage && (
        <img
          src={src}
          alt={username ? `${username}'s avatar` : 'User avatar'}
          className={styles.image}
          onError={() => setImgError(true)}
          draggable={false}
        />
      )}

      {showInitials && (
        <span className={styles.initials} aria-hidden="true">
          {getInitials(username)}
        </span>
      )}

      {showFallbackIcon && (
        <User
          className={styles.fallbackIcon}
          size={iconSizeMap[size]}
          aria-hidden="true"
        />
      )}

      {showStatus && (
        <span
          className={`${styles.statusDot} ${isOnline ? styles.online : styles.offline}`}
          aria-label={isOnline ? 'Online' : 'Offline'}
          role="img"
        />
      )}
    </span>
  );
}
