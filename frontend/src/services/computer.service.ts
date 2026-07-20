// src/services/computer.service.ts

import api from '@/services/api';
import type { ComputerGame, CreateComputerGameRequest } from '@/types';

// ─── Service ────────────────────────────────────────────────────────────────────
// All computer-game HTTP calls live here. No fetching in components/hooks.

export const computerService = {
  /** Returns the user's in-progress computer game, or null if none exists. */
  async getActiveGame(): Promise<ComputerGame | null> {
    const response = await api.get<ComputerGame | null>('/computer-games/active');
    return response.data ?? null;
  },

  /** Creates a new computer game with the given settings, or returns an existing one. */
  async createOrGetGame(payload: CreateComputerGameRequest): Promise<ComputerGame> {
    const response = await api.post<ComputerGame>('/computer-games', payload);
    return response.data;
  },

  async getGame(gameId: string): Promise<ComputerGame> {
    const response = await api.get<ComputerGame>(`/computer-games/${gameId}`);
    return response.data;
  },
};