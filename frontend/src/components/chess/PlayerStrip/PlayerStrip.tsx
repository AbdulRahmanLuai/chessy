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
  /** Whether it is currently this player's turn */
  isActive: boolean;
  /**
   * Slot for the CapturedPieces component.
   * Rendered below the main info row when provided.
   */
  capturedPieces?: React.ReactNode;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlayerStrip({
  player,
  isActive,
  capturedPieces,
  className,
}: PlayerStripProps) {
  const { user, isConnected, color } = player;

  // Live-ticking time, computed locally so the 100ms tick only re-renders
  // this component (and its Clock child) — not the whole GameRoom tree.
  const timeRemainingMs = useClock(color);

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
