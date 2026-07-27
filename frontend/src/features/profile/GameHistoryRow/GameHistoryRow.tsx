// src/features/profile/GameHistoryRow/GameHistoryRow.tsx
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { Game } from '@/types';
import styles from './GameHistoryRow.module.css';

export interface GameHistoryRowProps {
  game: Game;
  /** id of the profile owner, used to determine perspective (win/loss/opponent) */
  viewerUserId: string;
  className?: string;
}

function getResultBadge(
  game: Game,
  viewerUserId: string
): {
  label: string;
  variant: 'success' | 'danger' | 'warning' | 'default';
} {
  if (!game.result) {
    return {
      label: game.status === 'IN_PROGRESS' ? 'In progress' : 'Aborted',
      variant: 'default',
    };
  }
  console.log(game);
  if (game.winner === null) {
    return { label: 'Draw', variant: 'warning' };
  }

  return game.winner === viewerUserId
    ? { label: 'Win', variant: 'success' }
    : { label: 'Loss', variant: 'danger' };
}

export function GameHistoryRow({
  game,
  viewerUserId,
  className,
}: GameHistoryRowProps) {
  const navigate = useNavigate();

  const isWhite = game.whitePlayer.id === viewerUserId;
  const opponent = isWhite ? game.blackPlayer : game.whitePlayer;
  const result = getResultBadge(game, viewerUserId);

  const timeControl = `${Math.round(game.timeInitialSeconds / 60)}+${game.timeIncrementSeconds}`;
  const date = new Date(
    game.finishedAt ?? game.createdAt
  ).toLocaleDateString();

  return (
    <div className={`${styles.row} ${className ?? ''}`}>
      <div className={styles.opponent}>
        <Avatar username={opponent?.displayName} size="md" />
        <div className={styles.opponentInfo}>
          <span className={styles.opponentName}>
            {opponent?.displayName ?? 'Waiting for opponent'}
          </span>
          <span className={styles.meta}>
            {timeControl} · {date}
          </span>
        </div>
      </div>

      <Badge variant={result.variant}>{result.label}</Badge>

      <Button
        variant="secondary"
        size="sm"
        iconLeft={<Eye size={16} />}
        onClick={() => navigate(`/game/${game.id}`)}
      >
        View
      </Button>
    </div>
  );
}