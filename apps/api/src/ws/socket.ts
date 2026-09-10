import { Server } from 'socket.io';
import { Redis } from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import { SOCKET_EVENTS } from '@chat-sdk/shared';

let ioInstance: Server | null = null;

export function initSocketServer(httpServer: any) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'];

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
  });

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const pubClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 5,
    retryStrategy: (times) => Math.min(times * 100, 5000),
  });
  const subClient = pubClient.duplicate();

  pubClient.on('error', (err) => {
    console.error('Redis pubClient error:', err);
  });
  subClient.on('error', (err) => {
    console.error('Redis subClient error:', err);
  });

  io.adapter(createAdapter(pubClient, subClient))
    .catch((err) => {
      console.error('Failed to create Redis adapter:', err);
      process.exit(1);
    });

  io.on('connection', (socket) => {
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('join_operators', () => {
      socket.join('operators');
    });

    socket.on('typing', (data: { conversationId: string; isTyping: boolean; name: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit(SOCKET_EVENTS.TYPING_INDICATOR, data);
      socket.to('operators').emit(SOCKET_EVENTS.TYPING_INDICATOR, data);
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
  });

  io.on('connect_error', (err) => {
    console.error('Socket.IO connection error:', err);
  });

  ioInstance = io;
  return io;
}

export function getIO(): Server {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized. Call initSocketServer first.');
  }
  return ioInstance;
}
