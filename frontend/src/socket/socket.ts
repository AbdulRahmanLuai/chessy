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

export function connectSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
    });
  }

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