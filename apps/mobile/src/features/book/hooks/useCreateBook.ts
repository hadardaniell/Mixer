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
      // The book lists (home feed + profile) both read from `['feed', 'my-books']`,
      // and a book can land in favorites too. The previous keys (`myBooks`,
      // `homeFeed`) matched nothing, so a new book only showed after a manual
      // refresh. Invalidating the `['feed', …]` prefix refetches every list.
      qc.invalidateQueries({ queryKey: ['feed', 'my-books'] });
      qc.invalidateQueries({ queryKey: ['feed', 'favorite-books'] });
    },
  });
}
