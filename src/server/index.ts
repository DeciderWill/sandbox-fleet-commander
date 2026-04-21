import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { initNfClient } from './nf-client.js';
import { healthRoutes } from './routes/health.js';
import { sandboxRoutes } from './routes/sandboxes.js';
import { execRoutes } from './routes/exec.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

// In production, serve the built frontend
if (process.env.NODE_ENV === 'production') {
  const fastifyStatic = await import('@fastify/static');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const clientDir = path.resolve(__dirname, '../../dist/client');

  await app.register(fastifyStatic.default, {
    root: clientDir,
    prefix: '/',
    wildcard: false,
  });

  // SPA fallback: serve index.html for non-API routes
  app.setNotFoundHandler(async (request, reply) => {
    if (request.url.startsWith('/api')) {
      return reply.status(404).send({ error: 'Not found' });
    }
    return reply.sendFile('index.html');
  });
}

// Register routes
await app.register(healthRoutes);
await app.register(sandboxRoutes);
await app.register(execRoutes);

// Global error handler for Northflank API errors
app.setErrorHandler(async (error: Error & { statusCode?: number }, _request, reply) => {
  app.log.error(error);
  const status = error.statusCode || 500;
  return reply.status(status).send({
    error: error.message || 'Internal server error',
  });
});

// Start
const port = parseInt(process.env.PORT || '4000', 10);
try {
  await initNfClient();
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`Server listening on http://localhost:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
