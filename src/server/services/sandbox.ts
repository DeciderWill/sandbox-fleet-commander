import { getApi, getProjectId } from '../nf-client.js';
import type { SandboxInfo, SandboxStatus } from '../types.js';

const SANDBOX_PREFIX = 'sandbox-';
const POLL_INTERVAL_MS = 1000;
const INITIAL_WAIT_MS = 30_000;

// In-memory cache for list results
let listCache: { data: SandboxInfo[]; timestamp: number } | null = null;
const LIST_CACHE_TTL_MS = 1000;

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

function mapStatus(service: any): { status: SandboxStatus; instances: number } {
  const id = service.id || service.appId;
  if (destroyingSet.has(id)) return { status: 'destroying', instances: 0 };

  const deploymentStatus = service.status?.deployment?.status;
  const instances = service.deployment?.instances ?? 0;

  // servicePaused is the authoritative signal from get.service. The list.services
  // response doesn't include it, which is why list results must be enriched via
  // get.service before calling mapStatus.
  if (service.servicePaused === true) {
    return { status: 'paused', instances: 0 };
  }

  if (deploymentStatus === 'FAILED') {
    return { status: 'error', instances };
  }

  if (deploymentStatus === 'COMPLETED' && instances > 0) {
    return { status: 'running', instances };
  }

  if (instances > 0) {
    return { status: 'creating', instances };
  }

  return { status: 'paused', instances: 0 };
}

function serviceToSandboxInfo(service: any): SandboxInfo {
  const id = service.id || service.appId || service.name;
  const last = lastCommands.get(id);
  const { status, instances } = mapStatus(service);
  return {
    id,
    name: service.name || id,
    image: service.deployment?.external?.imagePath || 'unknown',
    plan: service.billing?.deploymentPlan || 'unknown',
    status,
    createdAt: service.createdAt || new Date().toISOString(),
    instances,
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
  const services = result.data?.services ?? [];

  // list.services returns a slim shape without `servicePaused` or `deployment.instances`,
  // so fetch each sandbox individually in parallel to get the authoritative state.
  const sandboxIds: string[] = services
    .filter((s) => (s.name || s.id || '').startsWith(SANDBOX_PREFIX))
    .map((s) => s.id || s.name);

  // Clear destroying marks for services that Northflank has finished deleting.
  const presentIds = new Set(sandboxIds);
  for (const id of destroyingSet) {
    if (!presentIds.has(id)) {
      destroyingSet.delete(id);
      lastCommands.delete(id);
    }
  }

  const sandboxes: SandboxInfo[] = (
    await Promise.all(
      sandboxIds.map(async (id) => {
        try {
          return await getSandbox(id);
        } catch (e: any) {
          console.warn(`[listSandboxes] failed to fetch ${id}:`, e.message || e);
          return null;
        }
      })
    )
  ).filter((s): s is SandboxInfo => s !== null);

  listCache = { data: sandboxes, timestamp: Date.now() };
  return sandboxes;
}

export async function getSandbox(serviceId: string): Promise<SandboxInfo> {
  const api = getApi();
  const projectId = getProjectId();
  const result = await api.get.service({ parameters: { projectId, serviceId } });
  if (!result.data) {
    const message = result.error?.message || `service ${serviceId} not returned by Northflank`;
    throw new Error(message);
  }
  return serviceToSandboxInfo(result.data);
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
    },
  });

  // Step 2: scale to 1
  await api.patch.service.deployment({
    parameters: { projectId, serviceId: name },
    data: {
      deployment: { instances: 1 },
    },
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
      // Re-throw deliberate errors (sandbox failed) and fatal errors (auth, etc.)
      if (e.message?.includes('failed to start')) throw e;
      // Log transient errors but keep polling
      console.warn(`[sandbox poll] Transient error polling ${name}:`, e.message || e);
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
  } catch (e) {
    // If the API call itself failed the service is NOT being destroyed — clear the mark.
    destroyingSet.delete(serviceId);
    throw e;
  } finally {
    listCache = null;
  }
  // Leave destroyingSet entry in place. listSandboxes clears it once Northflank
  // actually drops the service from the list, so the UI keeps showing
  // "destroying" during the asynchronous teardown instead of flipping to "creating".
}

export async function pauseSandbox(serviceId: string): Promise<void> {
  const api = getApi();
  const projectId = getProjectId();
  await api.patch.service.deployment({
    parameters: { projectId, serviceId },
    data: {
      deployment: { instances: 0 },
    },
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
    },
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
