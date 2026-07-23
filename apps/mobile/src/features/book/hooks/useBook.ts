import type { RecipeBook } from '@mixer/contracts';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/hooks/useAuth';

import { bookApi } from '../api/bookApi';

export const bookQueryKey = (id: string) => ['book', id] as const;

export type BookRole = 'owner' | 'editor' | 'viewer';

/** A single recipe book plus the current user's role in it. */
export function useBook(bookId: string) {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: bookQueryKey(bookId),
    queryFn: () => bookApi.getById(bookId),
    enabled: !!bookId,
  });

  const book = q.data;
  const myRole = book && user?.id ? roleOf(book, user.id) : null;

  return {
    book,
    myRole,
    // Mirrors the server's rules so the UI doesn't offer actions that would 403.
    canEdit: myRole === 'owner' || myRole === 'editor',
    isOwner: myRole === 'owner',
    isLoading: q.isLoading,
    isError: q.isError,
  };
}

export function roleOf(book: RecipeBook, userId: string): BookRole | null {
  if (book.ownerId === userId) return 'owner';
  return book.members.find((m) => m.userId === userId)?.role ?? null;
}
