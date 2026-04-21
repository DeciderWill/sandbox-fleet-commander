import type { FastifyInstance } from 'fastify';
import { execCode } from '../services/exec.js';
import type { Language } from '../types.js';

const VALID_LANGUAGES: Language[] = ['python', 'node', 'bash', 'command'];

export async function execRoutes(app: FastifyInstance): Promise<void> {
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
}
