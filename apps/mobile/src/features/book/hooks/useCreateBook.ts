import type { CreateRecipeBookInput, RecipeBook } from '@mixer/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { feedApi } from '@/features/home/api/feedApi';

/**
 * Creates the recipe book in one call (name/description/tags/type/cover +
 * selected recipeIds). Refreshes the book lists on success.
 */
export function useCreateBook() {
  const qc = useQueryClient();
  return useMutation<RecipeBook, Error, CreateRecipeBookInput>({
    mutationFn: (input) => feedApi.createBook(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myBooks'] });
      qc.invalidateQueries({ queryKey: ['homeFeed'] });
    },
  });
}
