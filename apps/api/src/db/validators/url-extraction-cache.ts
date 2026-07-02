import type { CollectionValidator } from './types.js';

// Keep in sync with UrlExtractionCacheDoc in db/types.ts.
export const urlExtractionCacheValidator: CollectionValidator = {
  validationLevel: 'strict',
  validationAction: 'error',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['url', 'extraction', 'extractedAt'],
      properties: {
        url: { bsonType: 'string' },
        extraction: { bsonType: 'object' },
        extractedAt: { bsonType: 'date' },
      },
    },
  },
};
