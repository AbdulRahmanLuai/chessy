// src/services/friends.service.ts
import api from './api';
import type { Friendship, PaginatedResponse } from '@/types';

// Shape Spring Data actually returns for paginated endpoints.
// Mapped into the app's own `PaginatedResponse<T>` (defined in types/index.ts)
// so callers never touch Spring-specific field names.
interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

function toPaginatedResponse<T>(page: SpringPage<T>): PaginatedResponse<T> {
  return {
    data: page.content,
    total: page.totalElements,
    page: page.number,
    pageSize: page.size,
    hasMore: page.number + 1 < page.totalPages,
  };
}

export interface PageParams {
  page?: number;
  size?: number;
}

const DEFAULT_PAGE_SIZE = 20;

export const friendsService = {
  async sendRequest(targetUserId: string): Promise<Friendship> {
    const res = await api.post<Friendship>('/friends/requests', { targetUserId });
    return res.data;
  },

  async acceptRequest(friendshipId: string): Promise<Friendship> {
    const res = await api.post<Friendship>(`/friends/requests/${friendshipId}/accept`);
    return res.data;
  },

  async declineRequest(friendshipId: string): Promise<void> {
    await api.post(`/friends/requests/${friendshipId}/decline`);
  },

  async cancelOutgoingRequest(friendshipId: string): Promise<void> {
    await api.post(`friends/requests/${friendshipId}/decline`);
  },

  async removeFriend(friendshipId: string): Promise<void> {
    await api.delete(`/friends/${friendshipId}`);
  },

  async getFriends({ page = 0, size = DEFAULT_PAGE_SIZE }: PageParams = {}): Promise<PaginatedResponse<Friendship>> {
    const res = await api.get<SpringPage<Friendship>>('/friends', { params: { page, size } });
    return toPaginatedResponse(res.data);
  },

  async getIncomingRequests({ page = 0, size = DEFAULT_PAGE_SIZE }: PageParams = {}): Promise<PaginatedResponse<Friendship>> {
    const res = await api.get<SpringPage<Friendship>>('/friends/requests/incoming', { params: { page, size } });
    return toPaginatedResponse(res.data);
  },

  async getOutgoingRequests({ page = 0, size = DEFAULT_PAGE_SIZE }: PageParams = {}): Promise<PaginatedResponse<Friendship>> {
    const res = await api.get<SpringPage<Friendship>>('/friends/requests/outgoing', { params: { page, size } });
    return toPaginatedResponse(res.data);
  },
};