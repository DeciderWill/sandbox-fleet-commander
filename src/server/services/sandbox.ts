import { getApi, getProjectId } from '../nf-client.js';
import type { SandboxInfo, SandboxStatus } from '../types.js';

const SANDBOX_PREFIX = 'sandbox-';
const POLL_INTERVAL_MS = 2000;
const INITIAL_WAIT_MS = 30_000;

// In-memory cache for list results
let listCache: { data: SandboxInfo[]; timestamp: number } | null = null;
const LIST_CACHE_TTL_MS = 2000;

// In-memory last-command tracking
const lastCommands = new Map<string, { command: string; output: string }>();

export function setLastCommand(serviceId: string, command: string, output: string): void {
  lastCommands.set(serviceId, { command, output });
}

// Track services being destroyed so we can show "destroying" status
const destroyingSet = new Set<string>();

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function randomHex(len: number): string {
  const chars = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)];
  return out;
}

function mapStatus(service: any): SandboxStatus {
  const id = service.id || service.appId;
  if (destroyingSet.has(id)) return 'destroying';

  const deployStatus = service.status?.deployment?.status;
  const instances = service.deployment?.instances ?? service.status?.deployment?.instances ?? 0;

  if (deployStatus === 'FAILED' || deployStatus === 'ERROR') return 'error';
  if (deployStatus === 'COMPLETED' || deployStatus === 'RUNNING') {
    return instances === 0 ? 'paused' : 'running';
  }
  return 'creating';
}

function serviceToSandboxInfo(service: any): SandboxInfo {
  const id = service.id || service.appId || service.name;
  const last = lastCommands.get(id);
  return {
    id,
    name: service.name || id,
    image: service.deployment?.external?.imagePath || 'unknown',
    plan: service.billing?.deploymentPlan || 'unknown',
    status: mapStatus(service),
    createdAt: service.createdAt || new Date().toISOString(),
    instances: service.deployment?.instances ?? service.status?.deployment?.instances ?? 0,
    lastCommand: last?.command,
    lastOutput: last?.output,
  };
}

export async function listSandboxes(): Promise<SandboxInfo[]> {
  if (listCache && Date.now() - listCache.timestamp < LIST_CACHE_TTL_MS) {
    return listCache.data;
  }

  const api = getApi();
  const projectId = getProjectId();
  const result = await api.list.services({ parameters: { projectId } });
  const services = (result.data as any)?.services || [];

  const sandboxes: SandboxInfo[] = services
    .filter((s: any) => (s.name || s.id || '').startsWith(SANDBOX_PREFIX))
    .map(serviceToSandboxInfo);

  listCache = { data: sandboxes, timestamp: Date.now() };
  return sandboxes;
}

export async function getSandbox(serviceId: string): Promise<SandboxInfo> {
  const api = getApi();
  const projectId = getProjectId();
  const result = await api.get.service({ parameters: { projectId, serviceId } });
  return serviceToSandboxInfo(result.data as any);
}

export async function createSandbox(opts: {
  image: string;
  plan: string;
  name?: string;
}): Promise<SandboxInfo> {
  const api = getApi();
  const projectId = getProjectId();
  const lang = opts.image.split(':')[0].split('/').pop() || 'box';
  const name = opts.name || `${SANDBOX_PREFIX}${lang}-${randomHex(6)}`;

  // Step 1: create at instances: 0
  await api.create.service.deployment({
    parameters: { projectId },
    data: {
      name,
      billing: { deploymentPlan: opts.plan },
      deployment: {
        instances: 0,
        external: { imagePath: opts.image },
        storage: { ephemeralStorage: { storageSize: 2048 } },
        docker: { configType: 'customCommand', customCommand: 'tail -f /dev/null' },
      },
    } as any,
  });

  // Step 2: scale to 1
  await api.patch.service.deployment({
    parameters: { projectId, serviceId: name },
    data: {
      deployment: { instances: 1 },
    } as any,
  });

  // Step 3: poll until ready (max INITIAL_WAIT_MS, then return whatever state it's in)
  const start = Date.now();
  while (Date.now() - start < INITIAL_WAIT_MS) {
    await sleep(POLL_INTERVAL_MS);
    try {
      const info = await getSandbox(name);
      if (info.status === 'running') return info;
      if (info.status === 'error') throw new Error(`Sandbox ${name} failed to start`);
    } catch (e: any) {
      if (e.message?.includes('failed to start')) throw e;
    }
  }

  // Return in creating state — frontend polling will pick up the transition
  return {
    id: name,
    name,
    image: opts.image,
    plan: opts.plan,
    status: 'creating',
    createdAt: new Date().toISOString(),
    instances: 1,
  };
}

export async function destroySandbox(serviceId: string): Promise<void> {
  const api = getApi();
  const projectId = getProjectId();
  destroyingSet.add(serviceId);
  listCache = null;
  try {
    await api.delete.service({ parameters: { projectId, serviceId } });
  } finally {
    destroyingSet.delete(serviceId);
    lastCommands.delete(serviceId);
    listCache = null;
  }
}

export async function pauseSandbox(serviceId: string): Promise<void> {
  const api = getApi();
  const projectId = getProjectId();
  // Use patch to scale to 0 as the JS client may not expose pause/resume directly
  await api.patch.service.deployment({
    parameters: { projectId, serviceId },
    data: {
      deployment: { instances: 0 },
    } as any,
  });
  listCache = null;
}

export async function resumeSandbox(serviceId: string): Promise<SandboxInfo> {
  const api = getApi();
  const projectId = getProjectId();
  await api.patch.service.deployment({
    parameters: { projectId, serviceId },
    data: {
      deployment: { instances: 1 },
    } as any,
  });
  listCache = null;

  // Poll until running
  const start = Date.now();
  while (Date.now() - start < INITIAL_WAIT_MS) {
    await sleep(POLL_INTERVAL_MS);
    const info = await getSandbox(serviceId);
    if (info.status === 'running') return info;
  }
  return getSandbox(serviceId);
}
