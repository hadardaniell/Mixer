import type { CollectionValidator } from './types.js';

// Keep in sync with CoverImageDoc in db/types.ts.
export const coverImagesValidator: CollectionValidator = {
  validationLevel: 'strict',
  validationAction: 'error',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['dishKey', 'label', 'imageUrl', 'usageCount', 'createdAt', 'lastUsedAt'],
      properties: {
        dishKey: { bsonType: 'string' },
        label: { bsonType: 'string' },
        imageUrl: { bsonType: 'string' },
        // Embedding values that land exactly on 0 or 1 serialize as int32, so
        // the array cannot be pinned to 'double' alone (same as recipes.ts).
        embedding: { bsonType: 'array', items: { bsonType: ['double', 'int'] } },
        usageCount: { bsonType: ['int', 'long', 'double'] },
        createdAt: { bsonType: 'date' },
        lastUsedAt: { bsonType: 'date' },
      },
    },
  },
};
