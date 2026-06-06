import { useQuery } from '@tanstack/react-query';

import { feedApi } from '@/features/home/api/feedApi';

/**
 * The current user's draft recipes (status === 'draft'), newest first.
 * Powers the "recent drafts" row on the create-recipe screen.
 */
export function useDrafts(limit = 10) {
  return useQuery({
    queryKey: ['drafts', limit],
    queryFn: () => feedApi.drafts(limit),
    select: (res) => res.items,
  });
}
