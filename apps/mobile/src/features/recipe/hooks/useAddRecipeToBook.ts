import type { RecipeBook } from '@mixer/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { feedApi } from '@/features/home/api/feedApi';

/** Adds a recipe to one of the user's books and refreshes the book lists. */
export function useAddRecipeToBook() {
  const qc = useQueryClient();
  return useMutation<RecipeBook, Error, { bookId: string; recipeId: string }>({
    mutationFn: ({ bookId, recipeId }) => feedApi.addRecipeToBook(bookId, recipeId),
    onSuccess: (updated, { bookId }) => {
      qc.setQueryData<RecipeBook>(['book', bookId], (old) => ({
        ...updated,
        isFavorite: updated.isFavorite ?? old?.isFavorite,
      }));
      qc.invalidateQueries({ queryKey: ['feed', 'my-books'] });
      qc.invalidateQueries({ queryKey: ['myBooks'] });
    },
  });
}
