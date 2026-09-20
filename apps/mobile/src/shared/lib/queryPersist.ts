import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import type { Query } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

import { tokens } from '@/features/auth/services/tokens';
import { storage } from '@/shared/config/storage';

const CACHE_KEY = 'reactQuery.cache';
const ONE_DAY = 1000 * 60 * 60 * 24;

/**
 * Writes the query cache to the same key-value store the app already uses (MMKV
 * on device, localStorage on web), so a cold start can paint the home screen
 * from disk while the network refetch runs behind it. Without this every launch
 * began with an empty cache and a spinner.
 *
 * Synchronous by design: MMKV reads are synchronous, so the restore happens
 * before first paint rather than a frame later.
 */
export const queryPersister = createSyncStoragePersister({
  key: CACHE_KEY,
  throttleTime: 1_000,
  storage: {
    getItem: (key) => storage.getString(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  },
});

/**
 * Only the queries that decide what the first screen looks like are written to
 * disk. Persisting everything would grow without bound — recipe detail, search
 * results, every book ever opened — and on web it would run into the
 * localStorage quota, at which point the whole cache is dropped rather than
 * trimmed.
 */
const PERSISTED_ROOTS = new Set(['feed', 'categories']);

export const persistOptions = {
  persister: queryPersister,
  maxAge: ONE_DAY,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: Query) =>
      query.state.status === 'success' && PERSISTED_ROOTS.has(String(query.queryKey[0])),
  },
};

/**
 * Identifies whose cache is on disk. Passed as the persister's `buster`, so a
 * restore under a different account discards the stored cache instead of
 * showing the previous user's feed for the frame before the refetch lands.
 */
export function useSessionCacheKey(): string {
  return useSyncExternalStore(
    tokens.subscribe,
    () => tokens.getUser()?.id ?? 'anonymous',
    () => 'anonymous',
  );
}
