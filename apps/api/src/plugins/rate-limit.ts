import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

export async function rateLimitPlugin(fastify: FastifyInstance) {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });
}
