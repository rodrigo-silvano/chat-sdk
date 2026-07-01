import { Server } from 'socket.io';
import { Redis } from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';

let ioInstance: Server | null = null;

export function initSocketServer(httpServer: any) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const pubClient = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
  });
  const subClient = pubClient.duplicate();

  io.adapter(createAdapter(pubClient, subClient));

  io.on('connection', (socket) => {
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('join_operators', () => {
      socket.join('operators');
    });

    socket.on('typing', (data: { conversationId: string; isTyping: boolean; name: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing_indicator', data);
      socket.to('operators').emit('typing_indicator', data);
    });
  });

  ioInstance = io;
  return io;
}

export function getIO() {
  return ioInstance;
}
