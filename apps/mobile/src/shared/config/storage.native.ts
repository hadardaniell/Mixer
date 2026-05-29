import { MMKV } from 'react-native-mmkv';

export interface KVStorage {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
}

function createMMKVStorage(): KVStorage {
  const mmkv = new MMKV({ id: 'mixer' });
  return {
    getString: (k) => mmkv.getString(k),
    set: (k, v) => mmkv.set(k, v),
    delete: (k) => mmkv.delete(k),
  };
}

function createMemoryStorage(): KVStorage {
  const map = new Map<string, string>();
  return {
    getString: (k) => map.get(k),
    set: (k, v) => {
      map.set(k, v);
    },
    delete: (k) => {
      map.delete(k);
    },
  };
}

function pickStorage(): KVStorage {
  try {
    return createMMKVStorage();
  } catch {
    return createMemoryStorage();
  }
}

export const storage: KVStorage = pickStorage();

export const StorageKeys = {
  authAccessToken: 'auth.accessToken',
  authRefreshToken: 'auth.refreshToken',
  authUser: 'auth.user',
  language: 'settings.language',
  theme: 'settings.theme',
} as const;
