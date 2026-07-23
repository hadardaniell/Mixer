import type { ShareResourceType } from '@mixer/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { sharesApi } from '../api/sharesApi';

export const SENT_SHARES_QUERY_KEY = ['shares', 'sent'] as const;

interface ShareTarget {
  resourceType: ShareResourceType;
  resourceId: string;
}

/**
 * The friends a resource is already shared with (pending or accepted). Used to
 * grey those friends out in the picker — the server rejects a duplicate share
 * with a 409, so we'd rather not offer it at all.
 */
export function useAlreadySharedWith({ resourceType, resourceId }: ShareTarget, enabled: boolean) {
  const q = useQuery({
    queryKey: SENT_SHARES_QUERY_KEY,
    queryFn: () => sharesApi.sent(),
    enabled,
    staleTime: 30_000,
  });

  const friendIds = useMemo(() => {
    const items = q.data?.items ?? [];
    return new Set(
      items
        .filter(
          (s) =>
            s.resourceType === resourceType &&
            s.resourceId === resourceId &&
            (s.status === 'pending' || s.status === 'accepted'),
        )
        .map((s) => s.friendId),
    );
  }, [q.data, resourceType, resourceId]);

  return { friendIds, isLoading: q.isLoading };
}

export interface SendShareResult {
  sent: number;
  /** Friend ids the server refused (409 duplicate, 403, deleted user, …). */
  failed: string[];
}

/**
 * Sends one share request per selected friend. Failures are collected instead of
 * aborting, so sharing with four friends when one is already covered still
 * delivers the other three.
 */
export function useSendShare() {
  const qc = useQueryClient();

  return useMutation<SendShareResult, Error, ShareTarget & { friendIds: string[] }>({
    mutationFn: async ({ resourceType, resourceId, friendIds }) => {
      const results = await Promise.allSettled(
        friendIds.map((friendId) => sharesApi.create({ resourceType, resourceId, friendId })),
      );
      const failed = friendIds.filter((_, i) => results[i].status === 'rejected');
      return { sent: friendIds.length - failed.length, failed };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SENT_SHARES_QUERY_KEY });
    },
  });
}
