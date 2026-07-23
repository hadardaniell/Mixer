import type { RecipeBook, UpdateRecipeBookInput } from '@mixer/contracts';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/hooks/useAuth';

import { bookApi } from '../api/bookApi';
import { bookQueryKey } from './useBook';

interface BookList {
  items: RecipeBook[];
  total?: number;
}

/** Every cached list that renders book cards. */
const LIST_KEYS = [
  ['feed', 'my-books'],
  ['feed', 'favorite-books'],
  ['myBooks'],
] as const;

/**
 * The member/recipe/patch endpoints return the book without `isFavorite` (the
 * mapper only attaches it on the list and detail routes), so a blind overwrite
 * would silently clear the favorite star. Keep whatever the cache already knew.
 */
function merge(old: RecipeBook | undefined, updated: RecipeBook): RecipeBook {
  return { ...updated, isFavorite: updated.isFavorite ?? old?.isFavorite };
}

/**
 * Writes the server's updated book straight into the cache — the detail query
 * and every list that shows its card. No refetch: the response already carries
 * the book's new state, so the card updates in the same frame and the change is
 * still there on the next natural reload.
 */
function writeBook(qc: QueryClient, updated: RecipeBook) {
  qc.setQueryData<RecipeBook>(bookQueryKey(updated.id), (old) => merge(old, updated));
  for (const key of LIST_KEYS) {
    qc.setQueryData<BookList>([...key], (old) =>
      old
        ? {
            ...old,
            items: old.items.map((b) => (b.id === updated.id ? merge(b, updated) : b)),
          }
        : old,
    );
  }
}

/** Drops a book from every cached list (deleted, or the user left it). */
function dropBook(qc: QueryClient, bookId: string) {
  qc.removeQueries({ queryKey: bookQueryKey(bookId) });
  for (const key of LIST_KEYS) {
    qc.setQueryData<BookList>([...key], (old) =>
      old ? { ...old, items: old.items.filter((b) => b.id !== bookId) } : old,
    );
  }
}

/** All mutations the book detail screen needs, keyed to one book. */
export function useBookMutations(bookId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const myId = user?.id;
  const onSuccess = (updated: RecipeBook) => writeBook(qc, updated);

  const updateBook = useMutation({
    mutationFn: (input: UpdateRecipeBookInput) => bookApi.update(bookId, input),
    onSuccess,
  });

  const deleteBook = useMutation({
    mutationFn: () => bookApi.remove(bookId),
    onSuccess: () => dropBook(qc, bookId),
  });

  const addRecipes = useMutation({
    mutationFn: async (recipeIds: string[]) => {
      // The API takes one recipe per call; the last response carries them all.
      let latest: RecipeBook | undefined;
      for (const recipeId of recipeIds) latest = await bookApi.addRecipe(bookId, recipeId);
      return latest;
    },
    onSuccess: (updated) => updated && writeBook(qc, updated),
  });

  const removeRecipe = useMutation({
    mutationFn: (recipeId: string) => bookApi.removeRecipe(bookId, recipeId),
    onSuccess,
  });

  const addMembers = useMutation({
    mutationFn: async (input: { userIds: string[]; role: 'editor' | 'viewer' }) => {
      let latest: RecipeBook | undefined;
      for (const userId of input.userIds) {
        latest = await bookApi.addMember(bookId, { userId, role: input.role });
      }
      return latest;
    },
    onSuccess: (updated) => updated && writeBook(qc, updated),
  });

  const updateMemberRole = useMutation({
    mutationFn: (input: { userId: string; role: 'editor' | 'viewer' }) =>
      bookApi.updateMemberRole(bookId, input.userId, input.role),
    onSuccess,
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => bookApi.removeMember(bookId, userId),
    onSuccess: (updated, userId) => {
      // Removing myself is "leave book" — it stops being mine, so it leaves the
      // lists entirely instead of being patched in place.
      if (userId === myId) dropBook(qc, bookId);
      else writeBook(qc, updated);
    },
  });

  return {
    updateBook,
    deleteBook,
    addRecipes,
    removeRecipe,
    addMembers,
    updateMemberRole,
    removeMember,
  };
}
