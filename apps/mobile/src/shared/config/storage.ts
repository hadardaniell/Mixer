import { Platform } from 'react-native';

export interface KVStorage {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
}

function createMMKVStorage(): KVStorage | null {
  try {
    const { MMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
    const mmkv = new MMKV({ id: 'mixer' });
    return {
      getString: (k) => mmkv.getString(k),
      set: (k, v) => mmkv.set(k, v),
      delete: (k) => mmkv.delete(k),
    };
  } catch {
    return null;
  }
}

function createWebStorage(): KVStorage {
  return {
    getString: (k) => window.localStorage.getItem(k) ?? undefined,
    set: (k, v) => window.localStorage.setItem(k, v),
    delete: (k) => window.localStorage.removeItem(k),
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
  if (Platform.OS === 'web') return createWebStorage();
  return createMMKVStorage() ?? createMemoryStorage();
}

export const storage: KVStorage = pickStorage();

export const StorageKeys = {
  authToken: 'auth.token',
  authUser: 'auth.user',
  language: 'settings.language',
  theme: 'settings.theme',
} as const;
