import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from './events';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:9092';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function connectSocket(token: string) {
  if (socket?.connected) {
    return socket;
  }

  disconnectSocket();

  socket = io(SOCKET_URL, {
    auth: { token },
    query: { token },
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connect_error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.warn('Socket disconnected:', reason);
  });

  return socket;
}

export function getSocket() {
  if (!socket?.connected) {
    console.warn('getSocket() called but socket not connected. Returning null.');
    return null;
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}