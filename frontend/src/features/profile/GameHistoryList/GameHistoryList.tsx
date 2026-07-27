// src/features/profile/GameHistoryList/GameHistoryList.tsx
import  Button  from '@/components/ui/Button';
import  Spinner  from '@/components/ui/Spinner';
import { GameHistoryRow } from '@/features/profile/GameHistoryRow';
import type { Game } from '@/types';
import styles from './GameHistoryList.module.css';

export interface GameHistoryListProps {
  games: Game[];
  viewerUserId: string;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  className?: string;
}

export function GameHistoryList({
  games,
  viewerUserId,
  hasMore,
  isLoadingMore,
  onLoadMore,
  className,
}: GameHistoryListProps) {
  if (games.length === 0) {
    return (
      <div className={`${styles.empty} ${className ?? ''}`}>
        <p>No games played yet.</p>
      </div>
    );
  }

  return (
    <div className={`${styles.list} ${className ?? ''}`}>
      <h2 className={styles.title}>Game History</h2>
      <div className={styles.rows}>
        {games.map((game) => (
          <GameHistoryRow key={game.id} game={game} viewerUserId={viewerUserId} />
        ))}
      </div>
      {hasMore && (
        <div className={styles.loadMore}>
          <Button variant="secondary" onClick={onLoadMore} loading={isLoadingMore}>
            {isLoadingMore ? <Spinner size="sm" /> : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}