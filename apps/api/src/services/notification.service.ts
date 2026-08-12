import { ObjectId } from 'mongodb';
import type { Collections } from '../plugins/mongo.js';
import { getPushMessage } from './push-messages.js';

export type NotificationPayloadMap = {
  SHARE_REQUEST: {
    fromUserId: string;
    fromUserName: string;
    resourceType: 'recipe' | 'book';
    resourceId: string;
    resourceName: string;
    shareId: string;
  };
  SHARE_ACCEPTED: {
    fromUserId: string;
    fromUserName: string;
    resourceType: 'recipe' | 'book';
    resourceId: string;
    resourceName: string;
  };
  SHARE_REJECTED: {
    fromUserId: string;
    fromUserName: string;
    resourceType: 'recipe' | 'book';
    resourceId: string;
    resourceName: string;
  };
  OWNER_DELETED_RESOURCE: {
    fromUserId: string;
    fromUserName: string;
    resourceType: 'recipe' | 'book';
    resourceName: string;
    savedCopyId: string;
  };
  FRIEND_REQUEST: {
    fromUserId: string;
    fromUserName: string;
    fromUserAvatar: string | null;
    friendshipId: string;
  };
  FRIEND_ACCEPTED: {
    fromUserId: string;
    fromUserName: string;
    fromUserAvatar: string | null;
  };
  FRIEND_UNFRIENDED: {
    fromUserId: string;
    fromUserName: string;
    fromUserAvatar: string | null;
  };
  BOOK_INVITE: {
    fromUserId: string;
    fromUserName: string;
    bookId: string;
    bookName: string;
    role: 'editor' | 'viewer';
  };
  BOOK_INVITE_ACCEPTED: {
    fromUserId: string;
    fromUserName: string;
    bookId: string;
    bookName: string;
  };
  BOOK_INVITE_REJECTED: {
    fromUserId: string;
    fromUserName: string;
    bookId: string;
    bookName: string;
  };
};

export type NotificationType = keyof NotificationPayloadMap;

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const ACTIONABLE_TYPES = new Set<NotificationType>(['SHARE_REQUEST', 'FRIEND_REQUEST']);

class NotificationService {
  private collections: Collections | null = null;

  init(collections: Collections): void {
    this.collections = collections;
  }

  async send<T extends NotificationType>(
    userId: string,
    type: T,
    payload: NotificationPayloadMap[T],
  ): Promise<void> {
    if (!this.collections) {
      console.warn('[NotificationService] not initialized — skipping');
      return;
    }

    const now = new Date();
    const expiresAt = ACTIONABLE_TYPES.has(type)
      ? null
      : new Date(now.getTime() + THIRTY_DAYS_MS);

    await this.collections.notifications.insertOne({
      _id: new ObjectId(),
      userId: new ObjectId(userId),
      type,
      payload: payload as Record<string, unknown>,
      read: false,
      createdAt: now,
      expiresAt,
    });

    // Fire push in background — a push failure must never break the in-app notification.
    this.sendPush(userId, type, payload as Record<string, unknown>).catch((err) =>
      console.error('[NotificationService] push failed', err),
    );
  }

  private async sendPush(
    userId: string,
    type: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!this.collections) return;

    const [user, tokens] = await Promise.all([
      this.collections.users.findOne(
        { _id: new ObjectId(userId) },
        { projection: { locale: 1 } },
      ),
      this.collections.pushTokens.find({ userId: new ObjectId(userId) }).toArray(),
    ]);

    if (!user || tokens.length === 0) return;

    const message = getPushMessage(type, payload, user.locale ?? 'en');
    if (!message) return;

    const body = JSON.stringify(
      tokens.map((t) => ({ to: t.token, title: message.title, body: message.body })),
    );

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body,
    });

    if (!res.ok) {
      console.error('[NotificationService] Expo push returned', res.status);
      return;
    }

    // Parse per-ticket results and delete any token Expo says is no longer valid.
    // This is the only cleanup mechanism for stale tokens (uninstalled apps).
    type ExpoTicket = { status: 'ok' } | { status: 'error'; details?: { error?: string } };
    const json = (await res.json()) as { data: ExpoTicket[] };
    const staleTokens = json.data
      .map((ticket, i) => (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered' ? tokens[i]?.token ?? null : null))
      .filter((t): t is string => t !== null);

    if (staleTokens.length > 0) {
      await this.collections!.pushTokens.deleteMany({ token: { $in: staleTokens } });
    }
  }
}

export const notificationService = new NotificationService();
