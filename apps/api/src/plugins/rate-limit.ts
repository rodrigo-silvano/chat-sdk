import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

export async function rateLimitPlugin(fastify: FastifyInstance) {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
    keyGenerator: (req) => {
      return req.ip;
    },
    errorResponseBuilder: () => ({
      error: 'Too many requests, please try again later.',
    }),
  });
}

export async function authRateLimitPlugin(fastify: FastifyInstance) {
  await fastify.register(rateLimit, {
    max: 5,
    timeWindow: '1 minute',
    keyGenerator: (req) => {
      return req.ip;
    },
    skip: (req) => {
      return !req.url.startsWith('/api/auth');
    },
    errorResponseBuilder: () => ({
      error: 'Too many authentication attempts, please try again later.',
    }),
  });
}
