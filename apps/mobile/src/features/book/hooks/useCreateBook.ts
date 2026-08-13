//apps/mobile/src/features/book/hooks/useCreateBook.ts
import type { CreateRecipeBookInput, RecipeBook } from '@mixer/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { feedApi } from '@/features/home/api/feedApi';
import { bookApi } from '../api/bookApi';

interface CreateBookMutationInput {
  book: CreateRecipeBookInput;
  invitedIds: string[];
  invitedRole: 'editor' | 'viewer';
}

/**
 * Creates the recipe book in one call (name/description/tags/type/cover +
 * selected recipeIds). Refreshes the book lists on success.
 */
export function useCreateBook() {
  const qc = useQueryClient();
  return useMutation<RecipeBook, Error, CreateBookMutationInput>({
    mutationFn: async ({ book, invitedIds, invitedRole }) => {
      //Create the book first.
      const createdBook = await feedApi.createBook(book);
      // Add the selected members to the newly-created book.
      for (const userId of invitedIds) {
        await bookApi.addMember(createdBook.id, {
          userId,
          role: invitedRole,
        });
      }
      // Return the created book.
      return createdBook;
    },
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
