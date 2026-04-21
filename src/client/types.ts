export type Language = 'python' | 'node' | 'bash' | 'command';

export type SandboxStatus = 'creating' | 'running' | 'paused' | 'error' | 'destroying';

export interface SandboxInfo {
  id: string;
  name: string;
  image: string;
  plan: string;
  status: SandboxStatus;
  createdAt: string;
  instances: number;
  lastCommand?: string;
  lastOutput?: string;
}

export interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'python', label: 'Python' },
  { value: 'node', label: 'Node.js' },
  { value: 'bash', label: 'Bash' },
  { value: 'command', label: 'Command' },
];

export const IMAGES: { value: string; label: string }[] = [
  { value: 'python:3.12-slim', label: 'python:3.12-slim' },
  { value: 'node:22-slim', label: 'node:22-slim' },
  { value: 'ubuntu:22.04', label: 'ubuntu:22.04' },
];

export const PLANS: { value: string; label: string }[] = [
  { value: 'nf-compute-10', label: 'nf-compute-10' },
  { value: 'nf-compute-20', label: 'nf-compute-20' },
  { value: 'nf-compute-50', label: 'nf-compute-50' },
];

export const DEFAULT_CODE: Record<Language, string> = {
  python: 'print("Hello from Python via the Northflank API!")\n',
  node: 'console.log("Hello from Node.js via the Northflank API!");\n',
  bash: 'echo "Hello from Bash via the Northflank API!"\n',
  command: 'echo "Hello from $(uname -s) via the Northflank API!"\n',
};
