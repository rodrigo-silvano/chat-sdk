import type { FastifyInstance } from 'fastify';
import { HandoverService } from '../services/handover.service.js';
import { ChatService } from '../services/chat.service.js';
import { authenticate } from '../plugins/auth.js';
import { getIO } from '../ws/socket.js';
import { SOCKET_EVENTS } from '@chat-sdk/shared';

const handoverService = new HandoverService();
const chatService = new ChatService();

export async function handoverRoutes(fastify: FastifyInstance) {
  fastify.post('/:conversationId/request', { preHandler: authenticate }, async (request, reply) => {
    const { conversationId } = request.params as { conversationId: string };
    try {
      await handoverService.requestHandover(conversationId);
      const io = getIO();
      if (io) {
        io.to('operators').emit(SOCKET_EVENTS.CONVERSATION_STATUS_CHANGED, {
          conversationId,
          status: 'handover_requested',
        });
      }
      reply.send({ success: true });
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  });

  fastify.post('/:conversationId/assign', { preHandler: authenticate }, async (request, reply) => {
    const { conversationId } = request.params as { conversationId: string };
    const user = (request as any).user;
    try {
      await handoverService.assignOperator(conversationId, user.id);
      const io = getIO();
      if (io) {
        io.to('operators').emit(SOCKET_EVENTS.CONVERSATION_STATUS_CHANGED, {
          conversationId,
          status: 'active_human',
          assignedOperatorId: user.id,
        });
        io.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.AGENT_ASSIGNED, {
          operatorId: user.id,
        });
      }
      reply.send({ success: true });
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  });

  fastify.post('/:conversationId/reply', { preHandler: authenticate }, async (request, reply) => {
    const { conversationId } = request.params as { conversationId: string };
    const body = request.body as { content?: string };
    const user = (request as any).user;

    if (!body || !body.content) {
      reply.code(400).send({ error: 'Content is required' });
      return;
    }

    try {
      const msg = await chatService.createMessage({
        conversationId,
        role: 'operator',
        content: body.content,
        senderType: 'human',
      });

      const io = getIO();
      if (io) {
        io.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.NEW_MESSAGE, msg);
      }
      reply.send(msg);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  });

  fastify.post('/:conversationId/resolve', { preHandler: authenticate }, async (request, reply) => {
    const { conversationId } = request.params as { conversationId: string };
    try {
      await handoverService.resolveConversation(conversationId);
      const io = getIO();
      if (io) {
        io.to('operators').emit(SOCKET_EVENTS.CONVERSATION_STATUS_CHANGED, {
          conversationId,
          status: 'resolved',
        });
        io.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.CONVERSATION_STATUS_CHANGED, {
          conversationId,
          status: 'resolved',
        });
      }
      reply.send({ success: true });
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  });
}
