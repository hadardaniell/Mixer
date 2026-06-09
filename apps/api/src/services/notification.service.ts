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
};

export type NotificationType = keyof NotificationPayloadMap;

class NotificationService {
  public async send<T extends NotificationType>(
    userId: string,
    type: T,
    payload: NotificationPayloadMap[T],
  ): Promise<void> {
    console.log(`[NotificationService] Sending '${type}' notification to user: ${userId}`);
    console.log(`[NotificationService] Payload:`, payload);
    // TODO: Implement DB storage or delivery logic later
  }
}

export const notificationService = new NotificationService();
