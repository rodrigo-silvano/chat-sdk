import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service.js';

const authService = new AuthService();

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.code(401).send({ error: 'Unauthorized' });
      return;
    }
    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);
    (request as any).user = decoded;
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user || user.role !== 'admin') {
    reply.code(403).send({ error: 'Forbidden: Admin access required' });
    return;
  }
  if (!user.is2FaVerified) {
    reply.code(403).send({ error: 'Forbidden: 2FA verification required' });
  }
}
