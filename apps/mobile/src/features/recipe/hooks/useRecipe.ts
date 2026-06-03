import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { feedApi } from '@/features/home/api/feedApi';
import { trackRecipeView } from '@/features/home/storage/recentlyViewed';

/**
 * Fetches a single recipe by id and records it in the recently-viewed ring
 * (so the home "נצפו לאחרונה" row reflects this visit). Same data source the
 * home feed uses.
 */
export function useRecipe(id: string) {
  const query = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => feedApi.recipeById(id),
    enabled: !!id,
  });

  const fetchedId = query.data?.id;
  useEffect(() => {
    if (fetchedId) trackRecipeView(fetchedId);
  }, [fetchedId]);

  return query;
}
