import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';
import { RegisterInputSchema, LoginInputSchema } from '@chat-sdk/shared';
import { authenticate } from '../plugins/auth.js';
import type { RequestUser } from '../plugins/auth.js';

const authService = new AuthService();

const Verify2FaSchema = z.object({
  token: z.string().min(6, '2FA token must be at least 6 characters'),
});

const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

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

  fastify.post('/refresh', async (request, reply) => {
    const parse = RefreshTokenSchema.safeParse(request.body);
    if (!parse.success) {
      reply.code(400).send({ error: parse.error.format() });
      return;
    }
    try {
      const { refreshToken } = parse.data;
      const decoded = authService.verifyRefreshToken(refreshToken);
      const token = authService.generateRefreshToken(decoded.id, decoded.email, decoded.role);
      reply.send({ token });
    } catch (err: any) {
      reply.code(401).send({ error: err.message });
    }
  });

  fastify.post('/2fa/setup', { preHandler: authenticate }, async (request, reply) => {
    try {
      const user = request.user as RequestUser | undefined;
      if (!user) {
        reply.code(401).send({ error: 'Unauthorized' });
        return;
      }
      const result = await authService.setup2Fa(user.id);
      reply.send(result);
    } catch (err: any) {
      reply.code(400).send({ error: err.message });
    }
  });

  fastify.post('/2fa/verify', { preHandler: authenticate }, async (request, reply) => {
    const parse = Verify2FaSchema.safeParse(request.body);
    if (!parse.success) {
      reply.code(400).send({ error: parse.error.format() });
      return;
    }
    try {
      const user = request.user as RequestUser | undefined;
      if (!user) {
        reply.code(401).send({ error: 'Unauthorized' });
        return;
      }
      const result = await authService.verify2Fa(user.id, parse.data.token);
      reply.send(result);
    } catch (err: any) {
      reply.code(400).send({ error: err.message });
    }
  });
}
