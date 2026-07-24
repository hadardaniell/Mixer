//apps/api/src/db/validators/users.ts
import type { CollectionValidator } from './types.js';

// Keep in sync with UserDoc in db/types.ts.
export const usersValidator: CollectionValidator = {
  validationLevel: 'strict',
  validationAction: 'error',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'displayName', 'locale', 'role', 'createdAt', 'updatedAt'],
      properties: {
        email: { bsonType: 'string' },
        phoneNumber: { bsonType: 'string' },
        passwordHash: { bsonType: ['string', 'null'] },
        displayName: { bsonType: 'string' },
        avatarUrl: { bsonType: 'string' },
        locale: { enum: ['he', 'en'] },
        role: { enum: ['user', 'admin'] },
        providers: {
          bsonType: 'object',
          properties: {
            google: {
              bsonType: 'object',
              required: ['sub', 'email'],
              properties: {
                sub: { bsonType: 'string' },
                email: { bsonType: 'string' },
                linkedAt: { bsonType: 'date' },
              },
            },
          },
        },
        emailVerifiedAt: { bsonType: 'date' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' },
      },
    },
  },
};
