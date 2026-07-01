import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { agents } from '@chat-sdk/database';
import { eq } from 'drizzle-orm';
import { CreateAgentInputSchema } from '@chat-sdk/shared';
import { authenticate, requireAdmin } from '../plugins/auth.js';

export async function agentsRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    try {
      const records = await db.select().from(agents);
      reply.send(records);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  });

  fastify.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const records = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
      const agent = records[0];
      if (!agent) {
        reply.code(404).send({ error: 'Agent not found' });
        return;
      }
      reply.send(agent);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  });

  fastify.post('/', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const parse = CreateAgentInputSchema.safeParse(request.body);
    if (!parse.success) {
      reply.code(400).send({ error: parse.error.format() });
      return;
    }
    try {
      const [newAgent] = await db
        .insert(agents)
        .values({
          ...parse.data,
          config: (request.body as any).config || {},
        })
        .returning();
      reply.code(201).send(newAgent);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  });

  fastify.put('/:id', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parse = CreateAgentInputSchema.partial().safeParse(request.body);
    if (!parse.success) {
      reply.code(400).send({ error: parse.error.format() });
      return;
    }
    try {
      const updateData: any = {
        ...parse.data,
        updatedAt: new Date(),
      };
      if ((request.body as any).config !== undefined) {
        updateData.config = (request.body as any).config;
      }
      const [updatedAgent] = await db
        .update(agents)
        .set(updateData)
        .where(eq(agents.id, id))
        .returning();
      if (!updatedAgent) {
        reply.code(404).send({ error: 'Agent not found' });
        return;
      }
      reply.send(updatedAgent);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  });

  fastify.delete('/:id', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const [deletedAgent] = await db.delete(agents).where(eq(agents.id, id)).returning();
      if (!deletedAgent) {
        reply.code(404).send({ error: 'Agent not found' });
        return;
      }
      reply.send({ success: true });
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  });
}
