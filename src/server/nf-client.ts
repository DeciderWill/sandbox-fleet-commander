import { ApiClient, ApiClientInMemoryContextProvider } from '@northflank/js-client';

let api: ApiClient;

export async function initNfClient(): Promise<void> {
  const token = process.env.NORTHFLANK_API_TOKEN;
  const projectId = process.env.NORTHFLANK_PROJECT_ID;
  if (!token) throw new Error('NORTHFLANK_API_TOKEN is required');
  if (!projectId) throw new Error('NORTHFLANK_PROJECT_ID is required');

  const contextProvider = new ApiClientInMemoryContextProvider();
  await contextProvider.addContext({ name: 'default', token });
  api = new ApiClient(contextProvider);
}

export function getApi(): ApiClient {
  if (!api) throw new Error('Northflank client not initialized — call initNfClient() first');
  return api;
}

export function getProjectId(): string {
  return process.env.NORTHFLANK_PROJECT_ID!;
}
