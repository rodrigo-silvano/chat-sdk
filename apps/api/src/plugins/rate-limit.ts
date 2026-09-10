import fastifyRateLimit from '@fastify/rate-limit';
import type { FastifyInstance, FastifyPluginCallback } from 'fastify';
import type { RateLimitPluginOptions } from '@fastify/rate-limit';

export async function rateLimitPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyRateLimit as FastifyPluginCallback<RateLimitPluginOptions>, {
    max: 100,
    timeWindow: '15 minutes',
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: () => ({
      error: 'Too many requests, please try again later.',
    }),
  });
}

export async function authRateLimitPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyRateLimit as FastifyPluginCallback<RateLimitPluginOptions>, {
    max: 5,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.ip,
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
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
