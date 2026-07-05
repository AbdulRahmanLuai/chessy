import api from './api';
import type { Game } from '@/types';

export const gameService = {
  /**
   * Fetch full game state (initial load only).
   * Socket will handle updates after this.
   */
  async getGame(gameId: string): Promise<Game> {
    const res = await api.get<Game>(`/games/${gameId}`);
    return res.data;
  },

  async createGame(): Promise<Game> {
    const res = await api.post<Game>('/games');
    return res.data;
  },


  async getMoves(gameId: string) {
    const res = await api.get(`/games/${gameId}/moves`);
    return res.data;
  },

};

