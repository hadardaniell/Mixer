import type { AuthResponse } from '@mixer/contracts';

import { env } from '@/shared/config/env';
import { tokens } from '@/features/auth/services/tokens';

type Base = 'api' | 'ai';

export interface HttpOptions extends RequestInit {
  base?: Base;
  /** Skip Authorization header and 401-refresh retry. Use for auth endpoints. */
  skipAuth?: boolean;
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    readonly body?: unknown,
  ) {
    super(`${path} returned ${status}`);
  }
}

let refreshInFlight: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
  const refreshToken = tokens.getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${env.apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as AuthResponse;
    tokens.setSession(data.accessToken, data.refreshToken, data.user);
    return true;
  } catch {
    return false;
  }
}

function refreshOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function http<T>(path: string, opts: HttpOptions = {}): Promise<T> {
  const { base = 'api', headers, skipAuth, ...init } = opts;
  const baseUrl = base === 'ai' ? env.aiUrl : env.apiUrl;

  const doFetch = () => {
    const accessToken = skipAuth ? null : tokens.getAccessToken();
    return fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
    });
  };

  let res = await doFetch();

  if (res.status === 401 && !skipAuth && tokens.getRefreshToken()) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      res = await doFetch();
    } else {
      tokens.clear();
    }
  }

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = undefined;
    }
    throw new HttpError(res.status, path, body);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
