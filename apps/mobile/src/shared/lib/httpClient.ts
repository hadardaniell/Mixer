import { env } from '@/shared/config/env';
import { storage, StorageKeys } from '@/shared/config/storage';

type Base = 'api' | 'ai';

export interface HttpOptions extends RequestInit {
  base?: Base;
}

export async function http<T>(path: string, opts: HttpOptions = {}): Promise<T> {
  const { base = 'api', headers, ...init } = opts;
  const baseUrl = base === 'ai' ? env.aiUrl : env.apiUrl;
  const token = storage.getString(StorageKeys.authToken);

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    throw new Error(`${path} returned ${res.status}`);
  }

  return res.json() as Promise<T>;
}
