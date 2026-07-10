import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from './events';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:9092';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

type SocketReadyCallback = () => void;
const readyCallbacks: SocketReadyCallback[] = [];

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
    notifySocketReady();
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

/**
 * Subscribe to be notified once the socket is connected and ready.
 * If the socket is already connected, the callback fires immediately (synchronously),
 * so callers don't need to special-case "is it ready already?" themselves.
 * Returns an unsubscribe function for cleanup on unmount.
 */
export function onSocketReady(callback: SocketReadyCallback): () => void {
  if (socket?.connected) {
    callback();
    return () => {};
  }

  readyCallbacks.push(callback);
  return () => {
    const idx = readyCallbacks.indexOf(callback);
    if (idx !== -1) readyCallbacks.splice(idx, 1);
  } // this callback returned is called when a component unmounts
    // , it removes the callback to set up the component's listeners the queue.
}

function notifySocketReady() {
  // Snapshot + clear first, in case a callback subscribes/unsubscribes during iteration 
  // (don't want to loop over an array of changing size).
  const callbacks = readyCallbacks.splice(0, readyCallbacks.length);
  callbacks.forEach((cb) => cb());
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
    socket.disconnect();
    socket = null;
  }
  readyCallbacks.length = 0; // clear any queued callbacks, since socket is now disconnected
}