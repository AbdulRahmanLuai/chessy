// src/features/friends/FriendsList/FriendsList.tsx

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Swords, UserMinus, X, Check } from 'lucide-react';
import { friendsService } from '@/services/friends.service';
import { useFriendsVersion } from '@/store/friendStore';
import { useFriends } from '@/hooks/useFriends';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import type { Friendship } from '@/types';
import styles from './FriendsList.module.css';

export interface FriendsListProps {
  onSelectFriend?: (friend: Friendship) => void;
  selectedFriendId?: string | null;
  showActions?: boolean;
  onChallenge?: (friend: Friendship) => void;
}

const PAGE_SIZE = 20;

export function FriendsList({
  onSelectFriend,
  selectedFriendId = null,
  showActions = false,
  onChallenge,
}: FriendsListProps) {
  const friendsVersion = useFriendsVersion();
  const { removeFriend } = useFriends();

  const [friends, setFriends] = useState<Friendship[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadFirstPage() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await friendsService.getFriends({
          page: 0,
          size: PAGE_SIZE,
        });

        if (cancelled) return;

        setFriends(result.data);
        setPage(result.page);
        setHasMore(result.hasMore);
      } catch {
        if (!cancelled) {
          setError('Failed to load friends.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadFirstPage();

    return () => {
      cancelled = true;
    };
  }, [friendsVersion]);

  const loadMore = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await friendsService.getFriends({
        page: page + 1,
        size: PAGE_SIZE,
      });

      setFriends((prev) => [...prev, ...result.data]);
      setPage(result.page);
      setHasMore(result.hasMore);
    } catch {
      setError('Failed to load more friends.');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  const handleRemoveConfirm = useCallback(
    async (friendshipId: string) => {
      setIsRemoving(true);
      try {
        await removeFriend(friendshipId);
        setFriends((prev) => prev.filter((f) => f.id !== friendshipId));
      } finally {
        setIsRemoving(false);
        setConfirmingId(null);
      }
    },
    [removeFriend]
  );

  if (isLoading && friends.length === 0) {
    return (
      <div className={styles.stateWrapper}>
        <Spinner />
      </div>
    );
  }

  if (error && friends.length === 0) {
    return <p className={styles.errorText}>{error}</p>;
  }

  if (friends.length === 0) {
    return <p className={styles.emptyText}>No friends yet.</p>;
  }

  return (
    <div className={styles.wrapper}>
      <ul className={styles.list}>
        {friends.map((friend) => {
          const isConfirming = friend.id === confirmingId;

          if (showActions) {
            if (isConfirming) {
              return (
                <li key={friend.id} className={styles.confirmRow}>
                  <span className={styles.confirmText}>
                    Remove{' '}
                    <strong>@{friend.otherUsername}</strong>?
                  </span>
                  <div className={styles.confirmActions}>
                    <button
                      type="button"
                      className={styles.confirmYes}
                      onClick={() => handleRemoveConfirm(friend.id)}
                      disabled={isRemoving}
                    >
                      <Check size={14} />
                      Yes
                    </button>
                    <button
                      type="button"
                      className={styles.confirmNo}
                      onClick={() => setConfirmingId(null)}
                      disabled={isRemoving}
                    >
                      <X size={14} />
                      No
                    </button>
                  </div>
                </li>
              );
            }

            return (
              <li key={friend.id} className={styles.itemRow}>
                <Link
                  to={`/profile/${friend.otherUsername}`}
                  className={styles.avatarLink}
                  aria-label={`View ${friend.otherDisplayName}'s profile`}
                >
                  <Avatar username={friend.otherDisplayName} />
                </Link>

                <span className={styles.names}>
                  <span className={styles.displayName}>
                    {friend.otherDisplayName}
                  </span>
                  <span className={styles.username}>
                    @{friend.otherUsername}
                  </span>
                </span>

                <div className={styles.actions}>
                  <span className={styles.tooltipWrapper}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={styles.iconButton}
                      aria-label="Challenge"
                      onClick={() => onChallenge?.(friend)}
                    >
                      <Swords size={14} />
                    </Button>
                    <span className={styles.tooltipLabel} role="tooltip">
                      Challenge
                    </span>
                  </span>

                  <span className={styles.tooltipWrapper}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`${styles.iconButton} ${styles.dangerGhost}`}
                      aria-label="Remove"
                      onClick={() => setConfirmingId(friend.id)}
                    >
                      <UserMinus size={14} />
                    </Button>
                    <span className={styles.tooltipLabel} role="tooltip">
                      Remove
                    </span>
                  </span>
                </div>
              </li>
            );
          }

          const isSelected = friend.otherUserId === selectedFriendId;

          return (
            <li key={friend.id}>
              <button
                type="button"
                className={isSelected ? styles.rowSelected : styles.row}
                onClick={() => onSelectFriend?.(friend)}
                aria-pressed={isSelected}
              >
                <Avatar username={friend.otherDisplayName} />
                <span className={styles.names}>
                  <span className={styles.displayName}>
                    {friend.otherDisplayName}
                  </span>
                  <span className={styles.username}>
                    @{friend.otherUsername}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <Button
          variant="secondary"
          onClick={loadMore}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </div>
  );
}