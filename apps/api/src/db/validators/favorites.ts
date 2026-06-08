import type { CollectionValidator } from './types.js';

// Keep in sync with FavoriteDoc in db/types.ts.
export const favoritesValidator: CollectionValidator = {
  validationLevel: 'strict',
  validationAction: 'error',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'kind', 'targetId', 'createdAt'],
      properties: {
        userId: { bsonType: 'objectId' },
        kind: { enum: ['recipe', 'book'] },
        targetId: { bsonType: 'objectId' },
        createdAt: { bsonType: 'date' },
      },
    },
  },
};
