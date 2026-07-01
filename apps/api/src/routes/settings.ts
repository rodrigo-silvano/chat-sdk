import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { settings } from '@chat-sdk/database';
import { encrypt, decrypt } from '../utils/crypto.js';
import { authenticate, requireAdmin } from '../plugins/auth.js';

export async function settingsRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    try {
      const records = await db.select().from(settings);
      const result: Record<string, string> = {};
      for (const record of records) {
        result[record.key] = decrypt(record.value);
      }
      reply.send(result);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  });

  fastify.post('/', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const body = request.body as { settings?: Record<string, string> };
    if (!body || !body.settings) {
      reply.code(400).send({ error: 'Settings object is required' });
      return;
    }

    try {
      for (const [key, val] of Object.entries(body.settings)) {
        const encryptedValue = encrypt(val);
        await db
          .insert(settings)
          .values({
            key,
            value: encryptedValue,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: settings.key,
            set: {
              value: encryptedValue,
              updatedAt: new Date(),
            },
          });
      }
      reply.send({ success: true });
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  });
}
