//apps/api/src/db/validators/recipe-books.ts
import type { CollectionValidator } from './types.js';

// Keep in sync with RecipeBookDoc in db/types.ts.
export const recipeBooksValidator: CollectionValidator = {
  validationLevel: 'strict',
  validationAction: 'error',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: [
        'ownerId',
        'name',
        'type',
        'members',
        'recipeIds',
        'tags',
        'language',
        'createdAt',
        'updatedAt',
      ],
      properties: {
        ownerId: { bsonType: 'objectId' },
        name: { bsonType: 'string' },
        description: { bsonType: 'string' },
        coverImageUrl: { bsonType: 'string' },
        coverKey: { bsonType: 'string' },
        type: { enum: ['personal', 'shared', 'meal'] },
        // The auto-created "my recipes" book. Hidden from the browsable lists.
        system: { bsonType: 'bool' },
        members: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['userId', 'role', 'addedAt'],
            properties: {
              userId: { bsonType: 'objectId' },
              role: { enum: ['owner', 'editor', 'viewer'] },
              addedAt: { bsonType: 'date' },
              invitedBy: { bsonType: 'objectId' },
            },
          },
        },
        recipeIds: { bsonType: 'array', items: { bsonType: 'objectId' } },
        tags: { bsonType: 'array', items: { bsonType: 'string' } },
        language: {enum: ['he', 'en'],},
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' },
      },
    },
  },
};
