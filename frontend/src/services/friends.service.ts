import api from './api';
import type { Friendship } from '@/types';

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

  async removeFriend(friendshipId: string): Promise<void> {
    await api.delete(`/friends/${friendshipId}`);
  },

  async getFriends(): Promise<Friendship[]> {
    const res = await api.get<Friendship[]>('/friends');
    return res.data;
  },

  async getIncomingRequests(): Promise<Friendship[]> {
    const res = await api.get<Friendship[]>('/friends/requests/incoming');
    return res.data;
  },

  async getOutgoingRequests(): Promise<Friendship[]> {
    const res = await api.get<Friendship[]>('/friends/requests/outgoing');
    return res.data;
  },
};