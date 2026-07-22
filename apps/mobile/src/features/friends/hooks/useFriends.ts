import { useQuery } from '@tanstack/react-query';

import { friendsApi } from '@/features/friends/api/friendsApi';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const FRIENDS_QUERY_KEY = ['friends'] as const;

/**
 * The authenticated user's accepted friends. Shares the `['friends']` key that
 * the friend-action and notification mutations invalidate, so the list stays in
 * sync after a request is accepted or someone is unfriended.
 */
export function useFriends() {
  const { user } = useAuth();

  const q = useQuery({
    queryKey: FRIENDS_QUERY_KEY,
    queryFn: () => friendsApi.list(),
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  return {
    friends: q.data?.friends ?? [],
    count: q.data?.friends.length ?? 0,
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: q.refetch,
  };
}
