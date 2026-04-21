import type { FastifyInstance } from 'fastify';
import {
  listSandboxes,
  createSandbox,
  destroySandbox,
  pauseSandbox,
  resumeSandbox,
} from '../services/sandbox.js';

export async function sandboxRoutes(app: FastifyInstance): Promise<void> {
  // List
  app.get('/api/sandboxes', async () => {
    const sandboxes = await listSandboxes();
    return { sandboxes };
  });

  // Spawn N sandboxes (also handles single create when count=1)
  app.post<{
    Body: { count?: number; image?: string; plan?: string };
  }>('/api/sandboxes/spawn', async (request) => {
    const { count = 1, image = 'python:3.12-slim', plan = 'nf-compute-20' } = request.body || {};
    const capped = Math.min(Math.max(count, 1), 10);
    const promises = Array.from({ length: capped }, () =>
      createSandbox({ image, plan }).then(
        (sandbox) => ({ status: 'ok' as const, sandbox }),
        (error) => ({ status: 'error' as const, error: (error as Error).message }),
      ),
    );
    const results = await Promise.all(promises);
    return { results };
  });

  // Destroy
  app.delete<{ Params: { id: string } }>('/api/sandboxes/:id', async (request) => {
    await destroySandbox(request.params.id);
    return { ok: true };
  });

  // Pause
  app.post<{ Params: { id: string } }>('/api/sandboxes/:id/pause', async (request) => {
    await pauseSandbox(request.params.id);
    return { ok: true };
  });

  // Resume
  app.post<{ Params: { id: string } }>('/api/sandboxes/:id/resume', async (request) => {
    const sandbox = await resumeSandbox(request.params.id);
    return { sandbox };
  });
}
