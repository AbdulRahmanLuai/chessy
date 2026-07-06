import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from './events';

const SOCKET_URL = import.meta.env.VITE_API_URL;

let socket: Socket<
  ServerToClientEvents,
  ClientToServerEvents
> | null = null;

export function connectSocket(token: string) {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
  });

  return socket;
}

export function getSocket() {
  if (!socket) {
    throw new Error('Socket not initialized. Call connectSocket() first.');
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}