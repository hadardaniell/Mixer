import type { NotificationListResponse } from '@mixer/contracts';

import { http } from '@/shared/lib/httpClient';

export interface NotificationListParams {
  read?: boolean;
  limit?: number;
  skip?: number;
}

function toQuery(params: NotificationListParams): string {
  const q = new URLSearchParams();
  if (params.read !== undefined) q.set('read', String(params.read));
  if (params.limit !== undefined) q.set('limit', String(params.limit));
  if (params.skip !== undefined) q.set('skip', String(params.skip));
  const qs = q.toString();
  return qs ? `?${qs}` : '';
}

export const notificationsApi = {
  list: (params: NotificationListParams = {}) =>
    http<NotificationListResponse>(`/notifications${toQuery(params)}`),
  markRead: (id: string) => http<void>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => http<{ ok: boolean }>('/notifications/read-all', { method: 'PUT' }),
  remove: (id: string) => http<void>(`/notifications/${id}`, { method: 'DELETE' }),

  // Actions that resolve an actionable notification. The server deletes the
  // originating SHARE_REQUEST / FRIEND_REQUEST notification as a side effect.
  // Friend routes key on the *requester's userId*, not the friendshipId.
  acceptFriend: (fromUserId: string) =>
    http<{ status: 'accepted' }>(`/friends/${fromUserId}/accept`, { method: 'PUT' }),
  declineFriend: (fromUserId: string) =>
    http<{ status: 'deleted' }>(`/friends/request/${fromUserId}`, { method: 'DELETE' }),
  acceptShare: (shareId: string) =>
    http<unknown>(`/shares/${shareId}/accept`, { method: 'PUT' }),
  declineShare: (shareId: string) =>
    http<unknown>(`/shares/${shareId}/reject`, { method: 'PUT' }),
};
