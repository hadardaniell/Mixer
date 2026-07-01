import { ObjectId } from 'mongodb';
import type { Collections } from '../plugins/mongo.js';

export type NotificationPayloadMap = {
  SHARE_REQUEST: {
    fromUserId: string;
    resourceType: 'recipe' | 'book';
    resourceId: string;
    resourceName: string;
    shareId: string;
  };
  SHARE_ACCEPTED: {
    fromUserId: string;
    resourceType: 'recipe' | 'book';
    resourceId: string;
    resourceName: string;
  };
  SHARE_REJECTED: {
    fromUserId: string;
    resourceType: 'recipe' | 'book';
    resourceId: string;
    resourceName: string;
  };
  OWNER_DELETED_RESOURCE: {
    fromUserId: string;
    resourceType: 'recipe' | 'book';
    resourceName: string;
    savedCopyId: string;
  };
  FRIEND_REQUEST: {
    fromUserId: string;
    fromUserName: string;
    friendshipId: string;
  };
  FRIEND_ACCEPTED: {
    fromUserId: string;
    fromUserName: string;
  };
  FRIEND_UNFRIENDED: {
    fromUserId: string;
    fromUserName: string;
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

    // TODO: send push notification via Expo
    // const user = await this.collections.users.findOne(
    //   { _id: new ObjectId(userId) },
    //   { projection: { expoPushToken: 1 } },
    // );
    // if (user?.expoPushToken) {
    //   await sendExpoPushNotification(user.expoPushToken, type, payload);
    // }
  }
}

export const notificationService = new NotificationService();
