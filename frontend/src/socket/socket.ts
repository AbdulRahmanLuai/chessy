import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from './events';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:9092';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

type SocketReadyCallback = () => void;
const readyCallbacks: SocketReadyCallback[] = [];

type SocketReconnectCallback = () => void;
const reconnectCallbacks: SocketReconnectCallback[] = [];

export function connectSocket(token: string) {
  if (socket?.connected) {
    return socket;
  }

  disconnectSocket();

  socket = io(SOCKET_URL, {
    auth: { token: token },
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
    notifySocketReady();
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connect_error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.warn('Socket disconnected:', reason);
  });

  // Manager-level event: fires only on actual reconnects after a drop,
  // never on the initial connection.
  socket.io.on('reconnect', (attempt) => {
    console.log('Socket reconnected after attempt', attempt);
    notifySocketReconnect();
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

export function onSocketReady(callback: SocketReadyCallback): () => void {
  if (socket?.connected) {
    callback();
    return () => {};
  }

  readyCallbacks.push(callback);
  return () => {
    const idx = readyCallbacks.indexOf(callback);
    if (idx !== -1) readyCallbacks.splice(idx, 1);
  };
}

/**
 * Subscribe to be notified whenever the socket reconnects after a drop
 * (does NOT fire on the initial connection). Used to trigger re-sync
 * of application state that may have missed events while disconnected.
 * Returns an unsubscribe function for cleanup on unmount.
 */
export function onSocketReconnect(callback: SocketReconnectCallback): () => void {
  reconnectCallbacks.push(callback);
  return () => {
    const idx = reconnectCallbacks.indexOf(callback);
    if (idx !== -1) reconnectCallbacks.splice(idx, 1);
  };
}

function notifySocketReady() {
  const callbacks = readyCallbacks.splice(0, readyCallbacks.length);
  callbacks.forEach((cb) => cb());
}

function notifySocketReconnect() {
  // Not spliced/cleared — reconnects can happen repeatedly over a session,
  // so subscribers should keep receiving them until they unsubscribe.
  reconnectCallbacks.forEach((cb) => cb());
}

export function emitWhenReady<E extends keyof ClientToServerEvents>(
  event: E,
  ...args: Parameters<ClientToServerEvents[E]>
) {
  const socket = getSocket();
  if (socket) {
    socket.emit(event, ...args);
    return;
  }
  onSocketReady(() => {
    getSocket()?.emit(event, ...args);
  });
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.io.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  readyCallbacks.length = 0;
  reconnectCallbacks.length = 0;
}