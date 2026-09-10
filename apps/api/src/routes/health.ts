import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { Redis } from 'ioredis';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request, reply) => {
    const checks = {
      api: { status: 'ok' },
      database: { status: 'unknown' },
      redis: { status: 'unknown' },
    };

    try {
      await db.execute({ sql: 'SELECT 1' });
      checks.database.status = 'ok';
    } catch (err) {
      checks.database.status = 'error';
      checks.database.error = (err as Error).message;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      const redis = new Redis(redisUrl, { connectTimeout: 2000 });
      await redis.ping();
      await redis.quit();
      checks.redis.status = 'ok';
    } catch (err) {
      checks.redis.status = 'error';
      checks.redis.error = (err as Error).message;
    }

    const allOk = Object.values(checks).every((c) => (c as any).status === 'ok');
    const statusCode = allOk ? 200 : 503;

    reply.code(statusCode).send({
      status: allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    });
  });

  fastify.get('/health/ready', async (request, reply) => {
    const checks = {
      database: { status: 'unknown' },
      redis: { status: 'unknown' },
    };

    try {
      await db.execute({ sql: 'SELECT 1' });
      checks.database.status = 'ok';
    } catch (err) {
      checks.database.status = 'error';
      checks.database.error = (err as Error).message;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      const redis = new Redis(redisUrl, { connectTimeout: 2000 });
      await redis.ping();
      await redis.quit();
      checks.redis.status = 'ok';
    } catch (err) {
      checks.redis.status = 'error';
      checks.redis.error = (err as Error).message;
    }

    const allOk = Object.values(checks).every((c) => (c as any).status === 'ok');
    const statusCode = allOk ? 200 : 503;

    reply.code(statusCode).send({
      status: allOk ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
    });
  });
}
