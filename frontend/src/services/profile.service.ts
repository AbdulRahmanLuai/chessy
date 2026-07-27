// src/services/profile.service.ts
import api from './api';
import type { User, Game, PublicProfile} from '@/types';


// Matches Spring's Page<T> serialization exactly.
export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page, 0-indexed
  size: number;
  first: boolean;
  last: boolean;
}

export const profileService = {
async getProfile(userName: string): Promise<PublicProfile> {
  const res = await api.get<PublicProfile>(`/users/${userName}`);
  return res.data;
},

 
  async getGameHistory(
    userName: string,
    page = 0,
    size = 20
  ): Promise<SpringPage<Game>> {
    const res = await api.get<SpringPage<Game>>('/games', {
      params: { userName, page, size },
    });
    return res.data;
  },
};