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

/**
 * - `ok`: got a fresh session.
 * - `invalid`: the server definitively rejected the refresh token (revoked,
 *   expired, or missing) — the user really is logged out.
 * - `error`: transient failure (offline, timeout, 5xx). Keep the session; a
 *   later request will refresh successfully. We must NOT log the user out here.
 */
type RefreshResult = 'ok' | 'invalid' | 'error';

let refreshInFlight: Promise<RefreshResult> | null = null;

async function performRefresh(): Promise<RefreshResult> {
  const refreshToken = tokens.getRefreshToken();
  if (!refreshToken) return 'invalid';
  try {
    const res = await fetch(`${env.apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (res.ok) {
      const data = (await res.json()) as AuthResponse;
      tokens.setSession(data.accessToken, data.refreshToken, data.user);
      return 'ok';
    }
    // Only 401/403 mean the token itself is no good; treat 5xx/others as transient.
    return res.status === 401 || res.status === 403 ? 'invalid' : 'error';
  } catch {
    return 'error';
  }
}

function refreshOnce(): Promise<RefreshResult> {
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
    const result = await refreshOnce();
    if (result === 'ok') {
      res = await doFetch();
    } else if (result === 'invalid') {
      // Genuinely rejected — clear so the app falls back to the login screen.
      tokens.clear();
    }
    // 'error' (offline / 5xx): keep the session and let the original 401 throw
    // below; the user stays logged in and the next call will retry the refresh.
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
