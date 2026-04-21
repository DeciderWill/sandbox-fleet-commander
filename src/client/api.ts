import type { SandboxInfo, ExecResult, Language } from './types';

async function request<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data as T;
}

export async function listSandboxes(): Promise<SandboxInfo[]> {
  const data = await request<{ sandboxes: SandboxInfo[] }>('/api/sandboxes');
  return data.sandboxes;
}

export async function createSandbox(image: string, plan: string): Promise<SandboxInfo> {
  const data = await request<{ sandbox: SandboxInfo }>('/api/sandboxes', {
    method: 'POST',
    body: JSON.stringify({ image, plan }),
  });
  return data.sandbox;
}

export async function destroySandbox(id: string): Promise<void> {
  await request<{ ok: boolean }>(`/api/sandboxes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function pauseSandbox(id: string): Promise<void> {
  await request<{ ok: boolean }>(`/api/sandboxes/${encodeURIComponent(id)}/pause`, {
    method: 'POST',
  });
}

export async function resumeSandbox(id: string): Promise<SandboxInfo> {
  const data = await request<{ sandbox: SandboxInfo }>(
    `/api/sandboxes/${encodeURIComponent(id)}/resume`,
    { method: 'POST' },
  );
  return data.sandbox;
}

export async function execCode(id: string, code: string, language: Language): Promise<ExecResult> {
  return request<ExecResult>(`/api/sandboxes/${encodeURIComponent(id)}/exec`, {
    method: 'POST',
    body: JSON.stringify({ code, language }),
  });
}

export async function spawnSandboxes(
  count: number,
  image: string,
  plan: string,
): Promise<Array<{ status: 'ok'; sandbox: SandboxInfo } | { status: 'error'; error: string }>> {
  const data = await request<{
    results: Array<{ status: 'ok'; sandbox: SandboxInfo } | { status: 'error'; error: string }>;
  }>('/api/sandboxes/spawn', {
    method: 'POST',
    body: JSON.stringify({ count, image, plan }),
  });
  return data.results;
}

export async function broadcastExec(
  code: string,
  language: Language,
): Promise<Record<string, ExecResult>> {
  const data = await request<{ results: Record<string, ExecResult> }>('/api/sandboxes/broadcast', {
    method: 'POST',
    body: JSON.stringify({ code, language }),
  });
  return data.results;
}
