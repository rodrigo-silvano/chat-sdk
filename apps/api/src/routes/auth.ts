import type { FastifyInstance } from 'fastify';
import { AuthService } from '../services/auth.service.js';
import { RegisterInputSchema, LoginInputSchema } from '@chat-sdk/shared';
import { authenticate } from '../plugins/auth.js';

const authService = new AuthService();

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', async (request, reply) => {
    const parse = RegisterInputSchema.safeParse(request.body);
    if (!parse.success) {
      reply.code(400).send({ error: parse.error.format() });
      return;
    }
    try {
      const operator = await authService.register(parse.data);
      reply.code(201).send({ operator });
    } catch (err: any) {
      reply.code(400).send({ error: err.message });
    }
  });

  fastify.post('/login', async (request, reply) => {
    const parse = LoginInputSchema.safeParse(request.body);
    if (!parse.success) {
      reply.code(400).send({ error: parse.error.format() });
      return;
    }
    try {
      const result = await authService.login(parse.data);
      reply.send(result);
    } catch (err: any) {
      reply.code(401).send({ error: err.message });
    }
  });

  fastify.post('/2fa/setup', { preHandler: authenticate }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const result = await authService.setup2Fa(user.id);
      reply.send(result);
    } catch (err: any) {
      reply.code(400).send({ error: err.message });
    }
  });

  fastify.post('/2fa/verify', { preHandler: authenticate }, async (request, reply) => {
    const body = request.body as { token?: string };
    if (!body || !body.token) {
      reply.code(400).send({ error: 'Token is required' });
      return;
    }
    try {
      const user = (request as any).user;
      const result = await authService.verify2Fa(user.id, body.token);
      reply.send(result);
    } catch (err: any) {
      reply.code(400).send({ error: err.message });
    }
  });
}
