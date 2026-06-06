import { useMutation, useQueryClient } from '@tanstack/react-query';

import { http } from '@/shared/lib/httpClient';

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed', 'my-books'] });
      qc.invalidateQueries({ queryKey: ['feed', 'favorite-books'] });
    },
  });
}
