import type { CollectionValidator } from './types.js';

// Keep in sync with NotificationDoc in db/types.ts.
export const notificationsValidator: CollectionValidator = {
  validationLevel: 'strict',
  validationAction: 'error',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'type', 'payload', 'read', 'createdAt'],
      properties: {
        userId: { bsonType: 'objectId' },
        type: {
          enum: [
            'SHARE_REQUEST',
            'SHARE_ACCEPTED',
            'SHARE_REJECTED',
            'OWNER_DELETED_RESOURCE',
            'FRIEND_REQUEST',
            'FRIEND_ACCEPTED',
            'FRIEND_UNFRIENDED',
          ],
        },
        payload: { bsonType: 'object' },
        read: { bsonType: 'bool' },
        createdAt: { bsonType: 'date' },
        expiresAt: { bsonType: ['date', 'null'] },
      },
    },
  },
};
