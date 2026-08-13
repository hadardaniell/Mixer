import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useRecipeCategoryTag } from '@/features/categories/hooks/useCategories';
import { feedApi } from '@/features/home/api/feedApi';
import { recipeToCard } from '@/shared/lib/recipeToCard';
import type { RecipeCardData } from '@/shared/ui/RecipeCard';

/**
 * Hydrates a book's `recipeIds` into cards in one batch call. Recipes the user
 * can't read (or that were deleted) come back missing rather than failing the
 * whole list.
 */
export function useBookRecipes(recipeIds: string[]) {
  const tagOf = useRecipeCategoryTag();
  const key = useMemo(() => [...recipeIds].sort().join(','), [recipeIds]);

  const q = useQuery({
    queryKey: ['book-recipes', key],
    queryFn: () => feedApi.recipesByIds(recipeIds),
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
