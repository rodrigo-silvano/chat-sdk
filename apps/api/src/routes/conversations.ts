import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { conversations } from '@chat-sdk/database';
import { eq, desc, and } from 'drizzle-orm';
import { ChatService } from '../services/chat.service.js';
import { authenticate } from '../plugins/auth.js';

const chatService = new ChatService();

export async function conversationsRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    try {
      const query = request.query as { sessionId?: string; status?: string };
      const selectBuilder = db.select().from(conversations);

      let whereClause;
      if (query.sessionId && query.status) {
        whereClause = and(
          eq(conversations.sessionId, query.sessionId),
          eq(conversations.status, query.status)
        );
      } else if (query.sessionId) {
        whereClause = eq(conversations.sessionId, query.sessionId);
      } else if (query.status) {
        whereClause = eq(conversations.status, query.status);
      }

      const records = await (whereClause ? selectBuilder.where(whereClause) : selectBuilder).orderBy(
        desc(conversations.updatedAt)
      );
      reply.send(records);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  });

  fastify.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const conversation = await chatService.getConversation(id);
      if (!conversation) {
        reply.code(404).send({ error: 'Conversation not found' });
        return;
      }
      reply.send(conversation);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  });

  fastify.get('/:id/messages', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const messages = await chatService.getMessages(id);
      reply.send(messages);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  });
}
