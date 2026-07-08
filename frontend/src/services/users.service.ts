// src/services/users.service.ts
import api from './api';
import type { UserSearchResult, User } from '@/types';

export const usersService = {
  // Assumed backend endpoint: GET /users/search?prefix= — returns users
  // whose username starts with `prefix`. Not confirmed to exist yet
  // (per project decision: build frontend now, backend catches up).
  async searchByUsername(prefix: string): Promise<UserSearchResult[]> {
    const trimmed = prefix.trim();
    if (!trimmed) return [];
    const res = await api.get<UserSearchResult[]>('/users/search', {
      params: { prefix: trimmed },
    });
    return res.data;
  },

  // Assumed backend endpoint: GET /users?ids=a,b,c — batch user lookup.
  // Needed to resolve display name/username for incoming challenge senders,
  // since the socket payload (ChallengeReceivedEvent) only carries
  // `fromUserId`. Also not confirmed to exist yet.
  async getByIds(userIds: string[]): Promise<User[]> {
    const uniqueIds = Array.from(new Set(userIds)).filter(Boolean);
    if (uniqueIds.length === 0) return [];
    const res = await api.get<User[]>('/users', {
      params: { ids: uniqueIds.join(',') },
    });
    return res.data;
  },
};