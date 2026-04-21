import type { SandboxInfo, ExecResult, Language } from './types';

async function request<T>(url: string, opts?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts?.body != null) headers['Content-Type'] = 'application/json';
  const res = await fetch(url, {
    ...opts,
    headers: { ...headers, ...(opts?.headers as Record<string, string> | undefined) },
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server error: ${res.status} ${res.statusText}`);
  }

  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data as T;
}

export async function listSandboxes(): Promise<SandboxInfo[]> {
  const data = await request<{ sandboxes: SandboxInfo[] }>('/api/sandboxes');
  return data.sandboxes;
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
