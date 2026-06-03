import { storage, StorageKeys } from '@/shared/config/storage';

const MAX_ENTRIES = 50;

type Listener = () => void;
const listeners = new Set<Listener>();

export interface RecentlyViewedEntry {
  recipeId: string;
  viewedAt: number;
}

function load(): RecentlyViewedEntry[] {
  const raw = storage.getString(StorageKeys.recentlyViewedRecipes);
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
  storage.set(StorageKeys.recentlyViewedRecipes, JSON.stringify(entries));
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

export function clearRecentlyViewed(): void {
  storage.delete(StorageKeys.recentlyViewedRecipes);
  for (const l of listeners) l();
}

export function subscribeRecentlyViewed(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
