import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { initNfClient } from './nf-client.js';
import { healthRoutes } from './routes/health.js';
import { sandboxRoutes } from './routes/sandboxes.js';
import { execRoutes } from './routes/exec.js';

const app = Fastify({ logger: true });

// Treat an empty JSON body as `{}` instead of rejecting with 400. Some client
// fetches (DELETE, POST without a body) send Content-Type: application/json
// with no body, and the default parser rejects them.
app.addContentTypeParser(
  'application/json',
  { parseAs: 'string' },
  (_req, body: string, done) => {
    if (!body) return done(null, {});
    try {
      done(null, JSON.parse(body));
    } catch (err) {
      done(err as Error, undefined);
    }
  },
);

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

// Global error handler — always returns clean JSON
app.setErrorHandler(async (error: Error & Record<string, any>, _request, reply) => {
  app.log.error(error);

  // Extract a usable status code
  const status =
    error.statusCode ||
    error.status ||
    error.response?.status ||
    500;

  // Extract a usable message, avoiding raw object leaks
  const message =
    error.message ||
    error.data?.error?.message ||
    'Internal server error';

  return reply.status(status).send({ error: message });
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
