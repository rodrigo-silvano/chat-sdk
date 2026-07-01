import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';

export async function corsPlugin(fastify: FastifyInstance) {
  await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}
