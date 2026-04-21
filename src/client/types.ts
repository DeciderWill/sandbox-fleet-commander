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

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'python', label: 'Python' },
  { value: 'node', label: 'Node.js' },
  { value: 'go', label: 'Go' },
  { value: 'bash', label: 'Bash' },
];

export const IMAGES: { value: string; label: string }[] = [
  { value: 'python:3.12-slim', label: 'python:3.12-slim' },
  { value: 'node:22-slim', label: 'node:22-slim' },
  { value: 'golang:1.22-alpine', label: 'golang:1.22-alpine' },
  { value: 'ubuntu:22.04', label: 'ubuntu:22.04' },
];

export const PLANS: { value: string; label: string }[] = [
  { value: 'nf-compute-10', label: 'nf-compute-10' },
  { value: 'nf-compute-20', label: 'nf-compute-20' },
  { value: 'nf-compute-50', label: 'nf-compute-50' },
];

export const DEFAULT_CODE: Record<Language, string> = {
  python: 'print("Hello from Northflank!")\n',
  node: 'console.log("Hello from Northflank!");\n',
  go: `package main

import "fmt"

func main() {
\tfmt.Println("Hello from Northflank!")
}
`,
  bash: 'echo "Hello from Northflank!"\n',
};
