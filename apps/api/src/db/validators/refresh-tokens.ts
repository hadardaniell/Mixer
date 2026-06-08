import type { CollectionValidator } from './types.js';

// Keep in sync with RefreshTokenDoc in db/types.ts.
export const refreshTokensValidator: CollectionValidator = {
  validationLevel: 'strict',
  validationAction: 'error',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'tokenHash', 'expiresAt', 'createdAt'],
      properties: {
        userId: { bsonType: 'objectId' },
        tokenHash: { bsonType: 'string' },
        userAgent: { bsonType: 'string' },
        ipAddress: { bsonType: 'string' },
        expiresAt: { bsonType: 'date' },
        revokedAt: { bsonType: 'date' },
        createdAt: { bsonType: 'date' },
      },
    },
  },
};
