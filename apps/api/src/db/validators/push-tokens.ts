import type { CollectionValidator } from './types.js';

// Keep in sync with PushTokenDoc in db/types.ts.
export const pushTokensValidator: CollectionValidator = {
  validationLevel: 'strict',
  validationAction: 'error',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'token', 'deviceId', 'platform', 'createdAt', 'lastSeenAt'],
      properties: {
        userId: { bsonType: 'objectId' },
        token: { bsonType: 'string' },
        deviceId: { bsonType: 'string' },
        platform: { enum: ['ios', 'android'] },
        createdAt: { bsonType: 'date' },
        lastSeenAt: { bsonType: 'date' },
      },
    },
  },
};
