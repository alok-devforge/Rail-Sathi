import { io, Socket } from 'socket.io-client';
import { SERVER_URL } from './serverConfig';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      reconnectionDelay: 1500,
      timeout: 10000,
    });

    socket.on('connect', () => console.log('[socket] connected', socket?.id));
    socket.on('disconnect', (reason) => console.log('[socket] disconnected', reason));
    socket.on('connect_error', (err) => console.warn('[socket] connect error', err.message));
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
