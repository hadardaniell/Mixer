import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { feedApi } from '@/features/home/api/feedApi';
import {
  getRecentlyViewed,
  subscribeRecentlyViewed,
  type RecentlyViewedEntry,
} from '@/features/home/storage/recentlyViewed';
import type { RecipeCardData } from '@/shared/ui/RecipeCard';

const MAX_HOME_PREVIEW = 10;

/**
 * Returns the user's recently-viewed recipes — read from local MMKV ring,
 * then hydrated via per-id fetches. Reactive to changes in the local store
 * (so a new view from the recipe-detail screen updates the home row).
 */
export function useRecentlyViewed(limit = MAX_HOME_PREVIEW): {
  isLoading: boolean;
  items: Array<RecipeCardData & { isFavorite: boolean }>;
} {
  const [entries, setEntries] = useState<RecentlyViewedEntry[]>(() => getRecentlyViewed());

  useEffect(() => {
    return subscribeRecentlyViewed(() => setEntries(getRecentlyViewed()));
  }, []);

  const ids = useMemo(() => entries.slice(0, limit).map((e) => e.recipeId), [entries, limit]);
  const stableKey = ids.join(',');

  const recipesQ = useQuery({
    queryKey: ['feed', 'recently-viewed', stableKey],
    enabled: ids.length > 0,
    queryFn: async () => {
      const results = await Promise.all(ids.map((id) => feedApi.recipeById(id)));
      return results;
    },
  });

  const items = useMemo(() => {
    const fetched = recipesQ.data ?? [];
    const byId = new Map(fetched.map((r) => [r.id, r]));
    return ids
      .map((id) => byId.get(id))
      // Drafts are work-in-progress — never surface them in the feed, even if
      // the user just viewed one right after importing it.
      .filter((r): r is NonNullable<typeof r> => !!r && r.status !== 'draft')
      .map((r) => ({
        id: r.id,
        name: r.title,
        imageUrl: r.coverImageUrl,
        durationMinutes:
          (r.prepTimeMinutes ?? 0) + (r.cookTimeMinutes ?? 0) || undefined,
        tag: r.tags[0],
        isFavorite: r.isFavorite ?? false,
      }));
  }, [ids, recipesQ.data]);

  return { isLoading: recipesQ.isLoading, items };
}
