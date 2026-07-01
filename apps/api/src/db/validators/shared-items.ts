import type { CollectionValidator } from './types.js';

// Keep in sync with SharedItemDoc in db/types.ts.
export const sharedItemsValidator: CollectionValidator = {
  validationLevel: 'strict',
  validationAction: 'error',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['resourceType', 'resourceId', 'ownerId', 'friendId', 'status', 'savedAt', 'savedResourceId', 'createdAt'],
      properties: {
        resourceType: { enum: ['recipe', 'book'] },
        resourceId: { bsonType: 'objectId' },
        ownerId: { bsonType: 'objectId' },
        friendId: { bsonType: 'objectId' },
        status: { enum: ['pending', 'accepted', 'rejected'] },
        savedAt: { bsonType: ['date', 'null'] },
        savedResourceId: { bsonType: ['objectId', 'null'] },
        createdAt: { bsonType: 'date' },
      },
    },
  },
};
