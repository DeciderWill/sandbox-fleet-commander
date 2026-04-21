import type { FastifyInstance } from 'fastify';
import { execCode } from '../services/exec.js';
import { listSandboxes } from '../services/sandbox.js';
import type { Language } from '../types.js';

const VALID_LANGUAGES: Language[] = ['python', 'node', 'go', 'bash'];

export async function execRoutes(app: FastifyInstance): Promise<void> {
  // Execute code in a single sandbox
  app.post<{
    Params: { id: string };
    Body: { code: string; language: Language };
  }>('/api/sandboxes/:id/exec', async (request, reply) => {
    const { code, language } = request.body || {};
    if (!code) return reply.status(400).send({ error: 'code is required' });
    if (!VALID_LANGUAGES.includes(language)) {
      return reply.status(400).send({ error: `language must be one of: ${VALID_LANGUAGES.join(', ')}` });
    }
    const result = await execCode(request.params.id, code, language);
    return result;
  });

  // Broadcast: execute code in ALL running sandboxes
  app.post<{
    Body: { code: string; language: Language };
  }>('/api/sandboxes/broadcast', async (request, reply) => {
    const { code, language } = request.body || {};
    if (!code) return reply.status(400).send({ error: 'code is required' });
    if (!VALID_LANGUAGES.includes(language)) {
      return reply.status(400).send({ error: `language must be one of: ${VALID_LANGUAGES.join(', ')}` });
    }

    const sandboxes = await listSandboxes();
    const running = sandboxes.filter((s) => s.status === 'running');

    const entries = await Promise.all(
      running.map(async (s) => {
        try {
          const result = await execCode(s.id, code, language);
          return [s.id, result] as const;
        } catch (e: any) {
          return [s.id, { exitCode: 1, stdout: '', stderr: e.message || 'Unknown error' }] as const;
        }
      }),
    );

    const results = Object.fromEntries(entries);
    return { results };
  });
}
