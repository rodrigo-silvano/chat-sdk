import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service.js';

const authService = new AuthService();

interface RequestUser {
  id: string;
  email: string;
  role: string;
  is2FaVerified: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: RequestUser;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.code(401).send({ error: 'Unauthorized: Missing or invalid authorization header' });
      return;
    }
    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);
    request.user = decoded;
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized: Invalid or expired token' });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    reply.code(403).send({ error: 'Forbidden: Authentication required' });
    return;
  }
  if (user.role !== 'admin') {
    reply.code(403).send({ error: 'Forbidden: Admin access required' });
    return;
  }
  if (!user.is2FaVerified) {
    reply.code(403).send({ error: 'Forbidden: 2FA verification required' });
    return;
  }
}
