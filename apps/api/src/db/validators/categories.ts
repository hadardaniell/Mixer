import type { CollectionValidator } from './types.js';

// Keep in sync with CategoryDoc in db/types.ts.
export const categoriesValidator: CollectionValidator = {
  validationLevel: 'strict',
  validationAction: 'error',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['slug', 'label', 'accent', 'order', 'isActive'],
      properties: {
        slug: { bsonType: 'string' },
        label: {
          bsonType: 'object',
          required: ['he', 'en'],
          properties: {
            he: { bsonType: 'string' },
            en: { bsonType: 'string' },
          },
        },
        accent: { bsonType: 'string' },
        // Plain JSON numbers from a mongosh seed land as double; allow the
        // integer types too so a typed writer isn't rejected.
        order: { bsonType: ['int', 'long', 'double'] },
        isActive: { bsonType: 'bool' },
      },
    },
  },
};
