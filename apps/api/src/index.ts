import './env.js';
import Fastify from 'fastify';
import { initSocketServer } from './ws/socket.js';
import { authRoutes } from './routes/auth.js';
import { settingsRoutes } from './routes/settings.js';
import { agentsRoutes } from './routes/agents.js';
import { conversationsRoutes } from './routes/conversations.js';
import { chatRoutes } from './routes/chat.js';
import { handoverRoutes } from './routes/handover.js';
import { healthRoutes } from './routes/health.js';
import { corsPlugin } from './plugins/cors.js';
import { rateLimitPlugin, authRateLimitPlugin } from './plugins/rate-limit.js';

const fastify = Fastify({ logger: true });

await fastify.register(corsPlugin);
await fastify.register(rateLimitPlugin);
await fastify.register(authRateLimitPlugin);

await fastify.register(healthRoutes);
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(settingsRoutes, { prefix: '/api/settings' });
await fastify.register(agentsRoutes, { prefix: '/api/agents' });
await fastify.register(conversationsRoutes, { prefix: '/api/conversations' });
await fastify.register(chatRoutes, { prefix: '/api/chat' });
await fastify.register(handoverRoutes, { prefix: '/api/handover' });

await fastify.ready();
initSocketServer(fastify.server);

const PORT = parseInt(process.env.PORT, 10);
const HOST = process.env.HOST || '0.0.0.0';

if (isNaN(PORT)) {
  throw new Error('PORT must be a valid number');
}

try {
  await fastify.listen({ port: PORT, host: HOST });
  fastify.log.info(`Server listening on ${HOST}:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
