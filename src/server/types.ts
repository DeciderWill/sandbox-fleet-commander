export type Language = 'python' | 'node' | 'go' | 'bash';

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
