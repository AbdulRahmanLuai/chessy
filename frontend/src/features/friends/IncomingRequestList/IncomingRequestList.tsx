// src/features/friends/IncomingRequestList/IncomingRequestList.tsx

import { useEffect, useState, useCallback } from 'react';
import { UserCheck, UserX } from 'lucide-react';
import { friendsService } from '@/services/friends.service';
import { useIncomingRequestsVersion } from '@/store/friendStore';
import { useFriends } from '@/hooks/useFriends';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import type { Friendship } from '@/types';
import styles from './IncomingRequestList.module.css';

export interface IncomingRequestListProps {
  onAction?: () => void;
}

const PAGE_SIZE = 20;

export function IncomingRequestList({ onAction }: IncomingRequestListProps) {
  const incomingVersion = useIncomingRequestsVersion();
  const { acceptRequest, declineRequest } = useFriends();

  const [requests, setRequests] = useState<Friendship[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFirstPage() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await friendsService.getIncomingRequests({
          page: 0,
          size: PAGE_SIZE,
        });

        if (cancelled) return;

        setRequests(result.data);
        setPage(result.page);
        setHasMore(result.hasMore);
      } catch {
        if (!cancelled) {
          setError('Failed to load incoming requests.');
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
  }, [incomingVersion]);

  const loadMore = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await friendsService.getIncomingRequests({
        page: page + 1,
        size: PAGE_SIZE,
      });

      setRequests((prev) => [...prev, ...result.data]);
      setPage(result.page);
      setHasMore(result.hasMore);
    } catch {
      setError('Failed to load more requests.');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  const handleAccept = useCallback(
    async (friendshipId: string) => {
      setActingId(friendshipId);
      try {
        await acceptRequest(friendshipId);
        onAction?.();
      } finally {
        setActingId(null);
      }
    },
    [acceptRequest, onAction]
  );

  const handleDecline = useCallback(
    async (friendshipId: string) => {
      setActingId(friendshipId);
      try {
        await declineRequest(friendshipId);
        onAction?.();
      } finally {
        setActingId(null);
      }
    },
    [declineRequest, onAction]
  );

  if (isLoading && requests.length === 0) {
    return (
      <div className={styles.stateWrapper}>
        <Spinner />
      </div>
    );
  }

  if (error && requests.length === 0) {
    return <p className={styles.errorText}>{error}</p>;
  }

  if (requests.length === 0) {
    return <p className={styles.emptyText}>No incoming requests.</p>;
  }

  return (
    <div className={styles.wrapper}>
      <ul className={styles.list}>
        {requests.map((req) => (
          <li key={req.id} className={styles.itemRow}>
            <Avatar username={req.otherDisplayName} />

            <span className={styles.names}>
              <span className={styles.displayName}>
                {req.otherDisplayName}
              </span>
              <span className={styles.username}>@{req.otherUsername}</span>
            </span>

            <div className={styles.actions}>
              <Button
                size="sm"
                variant="primary"
                iconLeft={<UserCheck size={14} />}
                onClick={() => handleAccept(req.id)}
                loading={actingId === req.id}
                disabled={actingId !== null && actingId !== req.id}
              >
                Accept
              </Button>

              <Button
                size="sm"
                variant="danger"
                iconLeft={<UserX size={14} />}
                onClick={() => handleDecline(req.id)}
                loading={actingId === req.id}
                disabled={actingId !== null && actingId !== req.id}
              >
                Decline
              </Button>
            </div>
          </li>
        ))}
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