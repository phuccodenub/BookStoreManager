import type { Server as HttpServer } from 'node:http';
import { Server as SocketServer, type Socket } from 'socket.io';
import { logger } from '../logger/index.js';
import { AppError } from '../errors/index.js';
import { resolveAuthenticatedUser, type JwtPayload } from '../middleware/index.js';

let io: SocketServer | null = null;

function extractSocketToken(socket: Socket): string | null {
  const authToken = typeof socket.handshake.auth?.token === 'string'
    ? socket.handshake.auth.token
    : undefined;
  const authorization = Array.isArray(socket.handshake.headers.authorization)
    ? socket.handshake.headers.authorization[0]
    : socket.handshake.headers.authorization;
  const rawToken = authToken ?? authorization;
  if (!rawToken) return null;
  return rawToken.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;
}

export function setupSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    path: '/socket.io',
  });

  io.use(async (socket, next) => {
    const token = extractSocketToken(socket);
    if (!token) {
      next();
      return;
    }

    try {
      const user = await resolveAuthenticatedUser(token);
      socket.data.user = user;
      next();
    } catch (error) {
      const message = error instanceof AppError ? error.message : 'Unauthorized socket connection';
      next(new Error(message));
    }
  });

  io.on('connection', (socket) => {
    logger.debug({ socketId: socket.id }, 'Socket connected');

    const user = socket.data.user as JwtPayload | undefined;
    if (user) {
      socket.join(`user:${user.userId}`);
      socket.join(`role:${user.role}`);
    }

    socket.on('disconnect', () => {
      logger.debug({ socketId: socket.id }, 'Socket disconnected');
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error('Socket.IO has not been initialized');
  return io;
}
