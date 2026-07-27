// src/hooks/useProfile.ts
import { useCallback, useEffect, useState } from 'react';
import { profileService } from '@/services/profile.service';
import type { PublicProfile, Game } from '@/types';

export interface ProfileStats {
  total: number;
  wins: number;
  losses: number;
  draws: number;
}

interface UseProfileResult {
  user: PublicProfile | null;
  games: Game[];
  stats: ProfileStats;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
}

function computeStats(userId: string, games: Game[]): ProfileStats {
  const stats: ProfileStats = { total: 0, wins: 0, losses: 0, draws: 0 };
  for (const game of games) {
    if (!game.result) continue;
    stats.total += 1;
    if (game.winner === null) stats.draws += 1;
    else if (game.winner === userId) stats.wins += 1;
    else stats.losses += 1;
  }
  return stats;
}

export function useProfile(userName: string): UseProfileResult {
  const [user, setUser] = useState<PublicProfile | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [page, setPage] = useState(0); // 0-indexed, matches Spring Pageable
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      profileService.getProfile(userName),
      profileService.getGameHistory(userName, 0),
    ])
      .then(([profileData, gamesPage]) => {
        if (cancelled) return;
        setUser(profileData);
        setGames(gamesPage.content);
        setHasMore(!gamesPage.last);
        setPage(gamesPage.number);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load profile.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userName]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    profileService
      .getGameHistory(userName, nextPage)
      .then((gamesPage) => {
        setGames((prev) => [...prev, ...gamesPage.content]);
        setHasMore(!gamesPage.last);
        setPage(gamesPage.number);
      })
      .catch(() => setError('Failed to load more games.'))
      .finally(() => setIsLoadingMore(false));
  }, [userName, page, hasMore, isLoadingMore]);

  const stats = user ? computeStats(user.id, games) : { total: 0, wins: 0, losses: 0, draws: 0 };

  return { user, games, stats, isLoading, isLoadingMore, error, hasMore, loadMore };
}