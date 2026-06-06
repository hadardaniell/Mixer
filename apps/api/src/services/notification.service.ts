export type NotificationType =
  | 'SHARE_REQUEST'
  | 'SHARE_ACCEPTED'
  | 'SHARE_REJECTED'
  | 'OWNER_DELETED_RESOURCE';

export type NotificationPayload = {
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

// TODO: notifications team — implement this function
export async function sendNotification<T extends NotificationType>(
  userId: string,
  type: T,
  payload: NotificationPayload[T],
): Promise<void> {
  console.log('[notification stub]', { userId, type, payload });
}
