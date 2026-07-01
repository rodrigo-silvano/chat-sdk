import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { agents } from '@chat-sdk/database';
import { eq } from 'drizzle-orm';
import { ChatService } from '../services/chat.service.js';
import { IntentService } from '../services/intent.service.js';
import { HandoverService } from '../services/handover.service.js';
import { MemoryService } from '../services/memory.service.js';
import { getLLMAdapter } from '../providers/llm-router.js';
import { getIO } from '../ws/socket.js';
import { SOCKET_EVENTS } from '@chat-sdk/shared';

const chatService = new ChatService();
const intentService = new IntentService();
const handoverService = new HandoverService();
const memoryService = new MemoryService();

export async function chatRoutes(fastify: FastifyInstance) {
  fastify.post('/', async (request, reply) => {
    const { sessionId, agentId, content } = request.body as {
      sessionId?: string;
      agentId?: string;
      content?: string;
    };

    if (!sessionId || !agentId || !content) {
      reply.code(400).send({ error: 'sessionId, agentId, and content are required' });
      return;
    }

    try {
      const records = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);
      const agent = records[0];
      if (!agent) {
        reply.code(404).send({ error: 'Agent not found' });
        return;
      }

      const conversation = await chatService.getOrCreateConversation(agent.id, sessionId);

      await chatService.createMessage({
        conversationId: conversation.id,
        role: 'user',
        content,
        senderType: 'user',
      });

      const io = getIO();
      if (io) {
        io.to(`conversation:${conversation.id}`).emit(SOCKET_EVENTS.NEW_MESSAGE, {
          role: 'user',
          content,
          senderType: 'user',
          createdAt: new Date(),
        });
      }

      if (
        conversation.status === 'active_human' ||
        conversation.status === 'handover_requested' ||
        conversation.status === 'waiting_for_agent'
      ) {
        reply.raw.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });
        reply.raw.write(JSON.stringify({ type: 'status', status: conversation.status }) + '\n');
        reply.raw.end();
        return;
      }

      const history = await chatService.getMessages(conversation.id);
      const intent = await intentService.detectIntent(
        agent.provider,
        agent.model,
        content,
        history
      );

      if (intent === 'human_handover' || intent === 'frustration') {
        await handoverService.requestHandover(conversation.id);

        if (io) {
          io.to('operators').emit(SOCKET_EVENTS.CONVERSATION_STATUS_CHANGED, {
            conversationId: conversation.id,
            status: 'handover_requested',
          });
        }

        reply.raw.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });
        reply.raw.write(JSON.stringify({ type: 'status', status: 'handover_requested' }) + '\n');
        reply.raw.end();
        return;
      }

      const systemPromptWithMemory = await memoryService.injectMemory(
        agent.systemPrompt,
        sessionId
      );

      const adapter = await getLLMAdapter(agent.provider);
      const stream = adapter.streamChat({
        model: agent.model,
        messages: history,
        systemPrompt: systemPromptWithMemory,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
      });

      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      let completeResponse = '';
      for await (const chunk of stream) {
        if (chunk.type === 'text_delta') {
          completeResponse += chunk.content;
        }
        reply.raw.write(JSON.stringify(chunk) + '\n');
      }

      if (completeResponse) {
        const botMsg = await chatService.createMessage({
          conversationId: conversation.id,
          role: 'assistant',
          content: completeResponse,
          senderType: 'bot',
        });

        if (io) {
          io.to(`conversation:${conversation.id}`).emit(SOCKET_EVENTS.NEW_MESSAGE, botMsg);
        }
      }

      reply.raw.end();
    } catch (err: any) {
      if (!reply.raw.headersSent) {
        reply.code(500).send({ error: err.message });
      } else {
        reply.raw.write(JSON.stringify({ type: 'error', message: err.message }) + '\n');
        reply.raw.end();
      }
    }
  });
}
