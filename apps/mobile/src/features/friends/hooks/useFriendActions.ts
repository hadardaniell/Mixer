import { useMutation, useQueryClient } from '@tanstack/react-query';

import { friendsApi, type FriendshipStatus, type UserSearchResult } from '@/features/friends/api/friendsApi';

type Patch = Pick<UserSearchResult, 'friendshipStatus' | 'isRequester'>;

/**
 * The three friend-request actions available from a search row, with optimistic
 * cache updates so the button flips instantly. Every mutation reconciles the
 * relevant social caches on settle.
 *
 * The button never lets the current user *accept* here from a fresh search
 * (incoming requests are handled in the notifications inbox); this hook covers
 * send + cancel, plus accept for completeness.
 */
export function useFriendActions() {
  const qc = useQueryClient();

  // Patch a single user across every cached search result set.
  const patchUser = (userId: string, next: Patch) => {
    qc.setQueriesData<{ users: UserSearchResult[] }>(
      { queryKey: ['users', 'search'] },
      (old) => {
        if (!old) return old;
        return {
          users: old.users.map((u) =>
            u.id === userId ? { ...u, ...next } : u,
          ),
        };
      },
    );
  };

  // Snapshot -> optimistic patch, returning a rollback closure for onError.
  const optimistic = (userId: string, next: Patch) => {
    const snapshots = qc.getQueriesData<{ users: UserSearchResult[] }>({
      queryKey: ['users', 'search'],
    });
    patchUser(userId, next);
    return () => {
      for (const [key, data] of snapshots) qc.setQueryData(key, data);
    };
  };

  const reconcile = () => {
    qc.invalidateQueries({ queryKey: ['friends'] });
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  const sendRequest = useMutation({
    mutationFn: (userId: string) => friendsApi.sendRequest(userId),
    onMutate: (userId) =>
      ({ rollback: optimistic(userId, { friendshipStatus: 'pending', isRequester: true }) }),
    onError: (_e, _userId, ctx) => ctx?.rollback(),
    onSettled: reconcile,
  });

  const cancelRequest = useMutation({
    mutationFn: (userId: string) => friendsApi.cancelRequest(userId),
    onMutate: (userId) =>
      ({ rollback: optimistic(userId, { friendshipStatus: 'none', isRequester: false }) }),
    onError: (_e, _userId, ctx) => ctx?.rollback(),
    onSettled: reconcile,
  });

  const acceptRequest = useMutation({
    mutationFn: (userId: string) => friendsApi.acceptRequest(userId),
    onMutate: (userId) =>
      ({ rollback: optimistic(userId, { friendshipStatus: 'accepted', isRequester: false }) }),
    onError: (_e, _userId, ctx) => ctx?.rollback(),
    onSettled: reconcile,
  });

  return { sendRequest, cancelRequest, acceptRequest };
}

/** Resolves which action a row's primary button should trigger for a status. */
export function buttonActionFor(status: FriendshipStatus, isRequester: boolean) {
  if (status === 'none') return 'send' as const;
  if (status === 'pending') return isRequester ? ('cancel' as const) : ('accept' as const);
  return 'none' as const; // accepted / self -> no primary action
}
