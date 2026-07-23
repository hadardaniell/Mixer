import type { RecipeBook } from '@mixer/contracts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { feedApi } from '@/features/home/api/feedApi';

import type { BookRole } from './useBook';

export interface BookMember {
  userId: string;
  role: BookRole;
  displayName: string;
  avatarUrl?: string;
  isMe: boolean;
}

const ROLE_ORDER: Record<BookRole, number> = { owner: 0, editor: 1, viewer: 2 };

/**
 * The book's members with their profiles resolved. Sorted owner → editors →
 * viewers so the person who runs the book is always first.
 */
export function useBookMembers(book: RecipeBook | undefined, myId: string | undefined) {
  const userIds = useMemo(() => (book?.members ?? []).map((m) => m.userId), [book]);
  const key = useMemo(() => [...userIds].sort().join(','), [userIds]);

  const q = useQuery({
    queryKey: ['book-members', key],
    queryFn: () => feedApi.usersByIds(userIds),
    enabled: userIds.length > 0,
  });

  const members = useMemo((): BookMember[] => {
    if (!book) return [];
    const byId = new Map((q.data?.items ?? []).map((u) => [u.id, u]));
    return book.members
      .map((m) => {
        const u = byId.get(m.userId);
        return {
          userId: m.userId,
          role: m.role,
          displayName: u?.displayName ?? '',
          avatarUrl: u?.avatarUrl,
          isMe: m.userId === myId,
        };
      })
      .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role]);
  }, [book, q.data, myId]);

  return { members, isLoading: userIds.length > 0 && q.isLoading };
}
