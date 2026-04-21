import { getApi, getProjectId } from '../nf-client.js';
import { setLastCommand } from './sandbox.js';
import type { ExecResult, Language } from '../types.js';

const EXEC_TIMEOUT_MS = 60_000;

function toBase64(str: string): string {
  return Buffer.from(str).toString('base64');
}

function buildCommand(code: string, language: Language): string {
  // Raw command mode — pass through directly
  if (language === 'command') return code;

  const b64 = toBase64(code);
  switch (language) {
    case 'python':
      return `echo "${b64}" | base64 -d | python3`;
    case 'node':
      return `echo "${b64}" | base64 -d | node`;
    case 'bash':
      return `echo "${b64}" | base64 -d | bash`;
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

export async function execCode(
  serviceId: string,
  code: string,
  language: Language,
): Promise<ExecResult> {
  const api = getApi();
  const projectId = getProjectId();
  const command = buildCommand(code, language);

  let result: any;
  try {
    const execPromise = (api.exec as any).execServiceCommand(
      { projectId, serviceId },
      { command, shell: 'sh -c' },
    );
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Command timed out after ${EXEC_TIMEOUT_MS / 1000}s`)),
        EXEC_TIMEOUT_MS,
      ),
    );
    result = await Promise.race([execPromise, timeout]);
  } catch (e: any) {
    const msg = e?.message || e?.data?.error?.message || 'Command execution failed';
    return {
      exitCode: 1,
      stdout: '',
      stderr: `Exec error: ${msg}`,
    };
  }

  const execResult: ExecResult = {
    exitCode: result?.commandResult?.exitCode ?? 1,
    stdout: result?.stdOut ?? '',
    stderr: result?.stdErr ?? '',
  };

  // Track last command/output
  const outputPreview = (execResult.stdout || execResult.stderr).slice(0, 500);
  setLastCommand(serviceId, code.slice(0, 200), outputPreview);

  return execResult;
}
