export interface KVStorage {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
}

function createWebStorage(): KVStorage {
  return {
    getString: (k) => window.localStorage.getItem(k) ?? undefined,
    set: (k, v) => window.localStorage.setItem(k, v),
    delete: (k) => window.localStorage.removeItem(k),
  };
}

export const storage: KVStorage = createWebStorage();

export const StorageKeys = {
  authAccessToken: 'auth.accessToken',
  authRefreshToken: 'auth.refreshToken',
  authUser: 'auth.user',
  language: 'settings.language',
  theme: 'settings.theme',
} as const;
