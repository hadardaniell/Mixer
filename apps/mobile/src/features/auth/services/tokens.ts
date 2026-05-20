import type { PublicUser } from '@mixer/contracts';

import { storage, StorageKeys } from '@/shared/config/storage';

type Listener = () => void;

const listeners = new Set<Listener>();

function readUser(): PublicUser | null {
  const raw = storage.getString(StorageKeys.authUser);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PublicUser;
  } catch {
    return null;
  }
}

let accessToken: string | null = storage.getString(StorageKeys.authAccessToken) ?? null;
let refreshToken: string | null = storage.getString(StorageKeys.authRefreshToken) ?? null;
let user: PublicUser | null = readUser();

function emit() {
  for (const l of listeners) l();
}

export const tokens = {
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,
  getUser: () => user,
  isAuthenticated: () => accessToken !== null,

  setSession(nextAccess: string, nextRefresh: string, nextUser: PublicUser) {
    storage.set(StorageKeys.authAccessToken, nextAccess);
    storage.set(StorageKeys.authRefreshToken, nextRefresh);
    storage.set(StorageKeys.authUser, JSON.stringify(nextUser));
    accessToken = nextAccess;
    refreshToken = nextRefresh;
    user = nextUser;
    emit();
  },

  clear() {
    storage.delete(StorageKeys.authAccessToken);
    storage.delete(StorageKeys.authRefreshToken);
    storage.delete(StorageKeys.authUser);
    accessToken = null;
    refreshToken = null;
    user = null;
    emit();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
