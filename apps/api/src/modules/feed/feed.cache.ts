// apps/api/src/modules/feed/feed.cache.ts

/**
 * A per-user cache for the home feed, held in the API process.
 *
 * The feed is the most-read thing in the app and the least likely to have
 * changed between two reads — opening the app, backgrounding it and coming back
 * re-runs the whole composition against unchanged data. Deliberately in-process
 * rather than Redis: there is no Redis in this deployment, and a cache that
 * survives a restart would be one more thing to invalidate correctly.
 *
 * Correctness rests on `invalidateFeed` being called wherever a feed input
 * changes; the TTL is the backstop for the paths that miss it (a friend editing
 * a shared book, say), which is why it is seconds rather than minutes.
 */
const TTL_MS = 20_000;

type Entry = { expiresAt: number; value: unknown };

const entries = new Map<string, Entry>();

export function readFeedCache<T>(userId: string): T | undefined {
  const hit = entries.get(userId);
  if (!hit) return undefined;
  if (hit.expiresAt <= Date.now()) {
    entries.delete(userId);
    return undefined;
  }
  return hit.value as T;
}

export function writeFeedCache(userId: string, value: unknown): void {
  entries.set(userId, { expiresAt: Date.now() + TTL_MS, value });
}

/**
 * Drop the cached feed for every user whose view of the app just changed. Pass
 * all members of a shared book, not only the person who acted — a recipe added
 * to a book belongs on their feeds too.
 */
export function invalidateFeed(...userIds: Array<string | { toString(): string }>): void {
  for (const id of userIds) entries.delete(id.toString());
}
