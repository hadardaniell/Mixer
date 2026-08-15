import { useMutation, useQueryClient } from '@tanstack/react-query';

import { notificationsApi } from '@/features/notifications/api/notificationsApi';
import { NOTIFICATIONS_QUERY_KEY } from '@/features/notifications/hooks/useNotifications';
import { HttpError } from '@/shared/lib/httpClient';

interface FriendActionVars {
  notificationId: string;
  fromUserId: string;
}
interface ShareActionVars {
  notificationId: string;
  shareId: string;
}
interface BookInviteActionVars {
  notificationId: string;
  bookId: string;
}
interface PendingDeletionVars {
  notificationId: string;
}

/**
 * Mutations for the notifications inbox. Every action invalidates the
 * notifications query so the list + bell badge reconcile with the server
 * (which deletes actionable notifications on accept/reject). Accept/reject also
 * touch friends/feed data, so those caches are invalidated too.
 */
export function useNotificationActions() {
  const qc = useQueryClient();
  const invalidateNotifications = () =>
    qc.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
  const invalidateSocial = () => {
    qc.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    qc.invalidateQueries({ queryKey: ['feed'] });
    qc.invalidateQueries({ queryKey: ['friends'] });
  };

  // The share/friendship behind an actionable notification can already be gone
  // (resolved elsewhere, or seed data). The server answers 404 — treat the
  // notification as stale and remove it so it doesn't linger as a dead row.
  const settleAction = async (err: unknown, notificationId: string) => {
    if (err instanceof HttpError && err.status === 404) {
      try {
        await notificationsApi.remove(notificationId);
      } catch {
        // best-effort cleanup
      }
    }
    invalidateSocial();
  };

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: invalidateNotifications,
  });
  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: invalidateNotifications,
  });
  const remove = useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onSuccess: invalidateNotifications,
  });

  const acceptFriend = useMutation({
    mutationFn: (v: FriendActionVars) => notificationsApi.acceptFriend(v.fromUserId),
    onSuccess: invalidateSocial,
    onError: (err, v) => settleAction(err, v.notificationId),
  });
  const declineFriend = useMutation({
    mutationFn: (v: FriendActionVars) => notificationsApi.declineFriend(v.fromUserId),
    onSuccess: invalidateSocial,
    onError: (err, v) => settleAction(err, v.notificationId),
  });
  const acceptShare = useMutation({
    mutationFn: (v: ShareActionVars) => notificationsApi.acceptShare(v.shareId),
    onSuccess: invalidateSocial,
    onError: (err, v) => settleAction(err, v.notificationId),
  });
  const declineShare = useMutation({
    mutationFn: (v: ShareActionVars) => notificationsApi.declineShare(v.shareId),
    onSuccess: invalidateSocial,
    onError: (err, v) => settleAction(err, v.notificationId),
  });
  const acceptBookInvite = useMutation({
    mutationFn: (v: BookInviteActionVars) => notificationsApi.acceptBookInvite(v.bookId),
    onSuccess: invalidateSocial,
    onError: (err, v) => settleAction(err, v.notificationId),
  });
  const declineBookInvite = useMutation({
    mutationFn: (v: BookInviteActionVars) => notificationsApi.declineBookInvite(v.bookId),
    onSuccess: invalidateNotifications,
    onError: (err, v) => settleAction(err, v.notificationId),
  });

  const acceptPendingCopy = useMutation({
    mutationFn: (v: PendingDeletionVars) => notificationsApi.savePendingCopy(v.notificationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: async (err, v) => {
      // 400 = notification has no snapshot (created before this feature was deployed)
      // 404 = notification already gone — either way, dismiss it so it doesn't linger
      if (err instanceof HttpError && (err.status === 400 || err.status === 404)) {
        try { await notificationsApi.remove(v.notificationId); } catch { /* best-effort */ }
      }
      invalidateNotifications();
    },
  });

  const declinePendingCopy = useMutation({
    mutationFn: (v: PendingDeletionVars) => notificationsApi.remove(v.notificationId),
    onSuccess: invalidateNotifications,
  });

  return {
    markRead,
    markAllRead,
    remove,
    acceptFriend,
    declineFriend,
    acceptShare,
    declineShare,
    acceptBookInvite,
    declineBookInvite,
    acceptPendingCopy,
    declinePendingCopy,
  };
}
