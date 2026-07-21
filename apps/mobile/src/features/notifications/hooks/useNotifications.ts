import { useQuery } from '@tanstack/react-query';

import { notificationsApi } from '@/features/notifications/api/notificationsApi';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;

// Polling model (no push yet): keep the badge/list roughly fresh while the app
// is open, and refetch on demand when the screen gains focus.
const STALE_MS = 30_000;
const POLL_MS = 60_000;
const PAGE_SIZE = 50;

export function useNotifications() {
  const q = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => notificationsApi.list({ limit: PAGE_SIZE }),
    staleTime: STALE_MS,
    refetchInterval: POLL_MS,
  });

  return {
    notifications: q.data?.items ?? [],
    unreadCount: q.data?.unreadCount ?? 0,
    total: q.data?.total ?? 0,
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: q.refetch,
  };
}
