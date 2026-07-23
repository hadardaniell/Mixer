import type { RecipeBook } from '@mixer/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { http } from '@/shared/lib/httpClient';

interface BookList {
  items: RecipeBook[];
  total?: number;
}

async function toggleRecipeFavorite(recipeId: string, next: boolean): Promise<void> {
  await http(`/favorites/recipes/${recipeId}`, { method: next ? 'POST' : 'DELETE' });
}

async function toggleBookFavorite(bookId: string, next: boolean): Promise<void> {
  await http(`/favorites/books/${bookId}`, { method: next ? 'POST' : 'DELETE' });
}

export function useToggleRecipeFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) =>
      toggleRecipeFavorite(id, next),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed', 'favorite-recipes'] });
      qc.invalidateQueries({ queryKey: ['feed', 'my-recipes'] });
      qc.invalidateQueries({ queryKey: ['recipe'] });
    },
  });
}

export function useToggleBookFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) => toggleBookFavorite(id, next),
    onSuccess: (_res, { id, next }) => {
      // The endpoint returns nothing, but `next` is the new state — patch the
      // cached book in place instead of refetching every list.
      qc.setQueryData<RecipeBook>(['book', id], (old) =>
        old ? { ...old, isFavorite: next } : old,
      );
      for (const key of [['feed', 'my-books'], ['myBooks']]) {
        qc.setQueryData<BookList>(key, (old) =>
          old
            ? { ...old, items: old.items.map((b) => (b.id === id ? { ...b, isFavorite: next } : b)) }
            : old,
        );
      }
      // This list's membership changes, not just a flag on an existing row, so
      // it's the one that genuinely has to be re-read.
      qc.invalidateQueries({ queryKey: ['feed', 'favorite-books'] });
    },
  });
}
