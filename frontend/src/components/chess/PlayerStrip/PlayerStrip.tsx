import { WifiOff } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Clock from '@/components/chess/Clock';
import { useClock } from '@/hooks/useClock';
import type { GamePlayer } from '@/types';
import styles from './PlayerStrip.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PlayerStripProps {
  player: GamePlayer;
  isActive: boolean;
  /** Timestamp the player's time snapshot is anchored to (last move, or game creation). */
  anchorTimestamp: string | null | undefined;
  capturedPieces?: React.ReactNode;
  className?: string;
}

export default function PlayerStrip({
  player,
  isActive,
  anchorTimestamp,
  capturedPieces,
  className,
}: PlayerStripProps) {
  const { user, isConnected, timeRemainingMs: baseRemainingMs } = player;

  const timeRemainingMs = useClock({ baseRemainingMs, anchorTimestamp, isActive });

  const rootClass = [
    styles.root,
    isActive ? styles.active : styles.idle,
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass}>
      {/* ── Main row: avatar + info + clock ──────────────────────────────── */}
      <div className={styles.mainRow}>

        {/* Left — avatar + name + rating */}
        <div className={styles.playerInfo}>
          <div className={styles.avatarWrapper}>
            <Avatar
              src={user.avatarUrl}
              username={user.username}
              size="md"
              ring={isActive}
            />
            {/* Disconnected badge overlaid on avatar */}
            {!isConnected && (
              <span className={styles.disconnectedDot} title="Opponent disconnected">
                <WifiOff size={10} aria-hidden="true" />
              </span>
            )}
          </div>

          <div className={styles.nameBlock}>
            <span className={styles.username} title={user.username}>
              {user.username}
            </span>
            <div className={styles.metaRow}>
              <Badge variant="accent" size="sm">
                {user.rating}
              </Badge>
              {!isConnected && (
                <Badge variant="warning" size="sm" dot>
                  Disconnected
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Right — clock */}
        <Clock
          timeRemainingMs={timeRemainingMs}
          isActive={isActive}
          label={`${user.username}'s clock`}
        />
      </div>

      {/* ── Captured pieces row (optional) ───────────────────────────────── */}
      {capturedPieces && (
        <div className={styles.capturedRow}>
          {capturedPieces}
        </div>
      )}
    </div>
  );
}
