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
    addHeaders: {
      'x-ratelimit-limit': '5',
      'x-ratelimit-remaining': '0',
      'x-ratelimit-reset': '60',
    },
    errorResponseBuilder: () => ({
      error: 'Too many authentication attempts, please try again later.',
    }),
  });

  fastify.addHook('onRoute', (routeOptions) => {
    if (!routeOptions.url.startsWith('/api/auth')) {
      return;
    }
    return;
  });
}
