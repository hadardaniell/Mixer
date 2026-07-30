import { tokens } from '@/features/auth/services/tokens';
import { storage, StorageKeys } from '@/shared/config/storage';

const MAX_ENTRIES = 50;

type Listener = () => void;
const listeners = new Set<Listener>();

export interface RecentlyViewedEntry {
  recipeId: string;
  viewedAt: number;
}

/**
 * Scoped per account, because the underlying store is not: localStorage is keyed by
 * browser and MMKV by install, so a shared key lets whoever signs in next inherit the
 * previous user's list — and hydrating it 403s on their private recipes.
 * Signed out, entries go to the bare key and are picked up once a user signs in.
 */
function storageKey(): string {
  const userId = tokens.getUser()?.id;
  return userId ? `${StorageKeys.recentlyViewedRecipes}.${userId}` : StorageKeys.recentlyViewedRecipes;
}

/**
 * Data written before the key was scoped belongs to whoever was signed in then — which
 * we can't know now. Migrating it would hand one user another's history, so drop it.
 */
function dropLegacyEntries(): void {
  if (storage.getString(StorageKeys.recentlyViewedRecipes)) {
    storage.delete(StorageKeys.recentlyViewedRecipes);
  }
}

function load(): RecentlyViewedEntry[] {
  const key = storageKey();
  if (key !== StorageKeys.recentlyViewedRecipes) dropLegacyEntries();
  const raw = storage.getString(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is RecentlyViewedEntry =>
        !!e &&
        typeof e === 'object' &&
        typeof e.recipeId === 'string' &&
        typeof e.viewedAt === 'number',
    );
  } catch {
    return [];
  }
}

function save(entries: RecentlyViewedEntry[]): void {
  storage.set(storageKey(), JSON.stringify(entries));
  for (const l of listeners) l();
}

/**
 * Append (or move-to-top) a recipe in the recently-viewed ring buffer.
 * Last `MAX_ENTRIES` are kept; duplicates collapse to the newest timestamp.
 */
export function trackRecipeView(recipeId: string): void {
  const now = Date.now();
  const current = load().filter((e) => e.recipeId !== recipeId);
  current.unshift({ recipeId, viewedAt: now });
  save(current.slice(0, MAX_ENTRIES));
}

/** Read the full list newest-first. */
export function getRecentlyViewed(): RecentlyViewedEntry[] {
  return load();
}

/** Drop a recipe from the ring — e.g. after it's deleted, so the home row
 *  doesn't keep trying to hydrate an id that no longer exists. */
export function removeRecentlyViewed(recipeId: string): void {
  const current = load();
  const next = current.filter((e) => e.recipeId !== recipeId);
  if (next.length !== current.length) save(next);
}

export function clearRecentlyViewed(): void {
  storage.delete(storageKey());
  for (const l of listeners) l();
}

export function subscribeRecentlyViewed(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
