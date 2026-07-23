import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useRecipeCategoryTag } from '@/features/categories/hooks/useCategories';
import { feedApi } from '@/features/home/api/feedApi';
import { recipeToCard } from '@/shared/lib/recipeToCard';
import type { RecipeCardData } from '@/shared/ui/RecipeCard';

/**
 * Hydrates a book's `recipeIds` into cards. There's no batch recipe endpoint
 * yet, so this fetches per id in parallel — the same approach the home feed
 * uses. Recipes the user can't read (or that were deleted) are dropped rather
 * than failing the whole list.
 */
export function useBookRecipes(recipeIds: string[]) {
  const tagOf = useRecipeCategoryTag();
  const key = useMemo(() => [...recipeIds].sort().join(','), [recipeIds]);

  const q = useQuery({
    queryKey: ['book-recipes', key],
    queryFn: async () => {
      const results = await Promise.allSettled(recipeIds.map((id) => feedApi.recipeById(id)));
      return results
        .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof feedApi.recipeById>>> =>
          r.status === 'fulfilled',
        )
        .map((r) => r.value);
    },
    enabled: recipeIds.length > 0,
  });

  const recipes = useMemo(
    () =>
      (q.data ?? []).map(
        (r): RecipeCardData & { isFavorite: boolean } => recipeToCard(r, tagOf(r)),
      ),
    [q.data, tagOf],
  );

  return { recipes, isLoading: recipeIds.length > 0 && q.isLoading };
}
