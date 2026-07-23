import type { Notification } from '@mixer/contracts';
import type { TFunction } from 'i18next';
import {
  Bookmark,
  Check,
  Share2,
  UserMinus,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react-native';

export type NotificationAction =
  | { kind: 'friend'; fromUserId: string }
  | { kind: 'share'; shareId: string };

export interface NotificationContent {
  Icon: LucideIcon;
  /** Theme key (no `$`) for the icon tint, used when there's no avatar. */
  color: string;
  title: string;
  body: string;
  /** Deep-link target for informational notifications (tap to open). */
  route?: string;
  /** Present for actionable notifications — drives inline accept/decline. */
  action?: NotificationAction;
  /**
   * Present for friend notifications — the row shows the sender's avatar
   * (or their initials) instead of the type icon.
   */
  avatar?: { url: string | null; name: string };
}

function resourceRoute(resourceType: 'recipe' | 'book', id: string): string | undefined {
  return resourceType === 'recipe' ? `/recipes/${id}` : `/books/${id}`;
}

/**
 * Maps a notification (discriminated on `type`) to everything the row needs to
 * render: icon, accent, localized copy, an optional deep link, and — for
 * actionable types — the accept/decline action descriptor.
 */
export function getNotificationContent(n: Notification, t: TFunction): NotificationContent {
  switch (n.type) {
    case 'SHARE_REQUEST':
      return {
        Icon: Share2,
        color: 'info',
        title: t('notifications.items.shareRequest.title'),
        body: t('notifications.items.shareRequest.body', {
          name: n.payload.fromUserName,
          resource: n.payload.resourceName,
        }),
        action: { kind: 'share', shareId: n.payload.shareId },
      };
    case 'SHARE_ACCEPTED':
      return {
        Icon: Check,
        color: 'success',
        title: t('notifications.items.shareAccepted.title'),
        body: t('notifications.items.shareAccepted.body', {
          name: n.payload.fromUserName,
          resource: n.payload.resourceName,
        }),
        route: resourceRoute(n.payload.resourceType, n.payload.resourceId),
      };
    case 'SHARE_REJECTED':
      return {
        Icon: X,
        color: 'warning',
        title: t('notifications.items.shareRejected.title'),
        body: t('notifications.items.shareRejected.body', {
          name: n.payload.fromUserName,
          resource: n.payload.resourceName,
        }),
        route: resourceRoute(n.payload.resourceType, n.payload.resourceId),
      };
    case 'OWNER_DELETED_RESOURCE':
      return {
        Icon: Bookmark,
        color: 'danger',
        title: t('notifications.items.ownerDeleted.title'),
        body: t('notifications.items.ownerDeleted.body', {
          name: n.payload.fromUserName,
          resource: n.payload.resourceName,
        }),
        route: resourceRoute(n.payload.resourceType, n.payload.savedCopyId),
      };
    case 'FRIEND_REQUEST':
      return {
        Icon: UserPlus,
        color: 'textMuted',
        title: t('notifications.items.friendRequest.title'),
        body: t('notifications.items.friendRequest.body', { name: n.payload.fromUserName }),
        action: { kind: 'friend', fromUserId: n.payload.fromUserId },
        avatar: { url: n.payload.fromUserAvatar, name: n.payload.fromUserName },
      };
    case 'FRIEND_ACCEPTED':
      return {
        Icon: Users,
        color: 'textMuted',
        title: t('notifications.items.friendAccepted.title'),
        body: t('notifications.items.friendAccepted.body', { name: n.payload.fromUserName }),
        avatar: { url: n.payload.fromUserAvatar, name: n.payload.fromUserName },
      };
    case 'FRIEND_UNFRIENDED':
      return {
        Icon: UserMinus,
        color: 'textMuted',
        title: t('notifications.items.friendUnfriended.title'),
        body: t('notifications.items.friendUnfriended.body', { name: n.payload.fromUserName }),
        avatar: { url: n.payload.fromUserAvatar, name: n.payload.fromUserName },
      };
  }
}
