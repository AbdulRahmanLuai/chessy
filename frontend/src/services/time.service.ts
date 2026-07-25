import { api } from './api';

interface ServerTimeResponse {
  serverTime: number;
}

/** Fetches the current server time (epoch ms). */
export async function fetchServerTime(): Promise<number> {
  const response = await api.get<ServerTimeResponse>('/time');
  return response.data.serverTime;
}