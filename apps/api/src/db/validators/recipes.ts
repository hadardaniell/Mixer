import type { Document } from 'mongodb';
import type { CollectionValidator } from './types.js';

const ingredients: Document = {
  bsonType: 'array',
  items: {
    bsonType: 'object',
    required: ['name'],
    properties: {
      name: { bsonType: 'string' },
      amount: { bsonType: ['double', 'int', 'long', 'decimal'] },
      unit: { bsonType: 'string' },
      note: { bsonType: 'string' },
    },
  },
};

const steps: Document = {
  bsonType: 'array',
  items: {
    bsonType: 'object',
    required: ['order', 'text'],
    properties: {
      order: { bsonType: 'int' },
      text: { bsonType: 'string' },
      durationMinutes: { bsonType: 'int' },
    },
  },
};

const source: Document = {
  bsonType: 'object',
  required: ['type'],
  properties: {
    type: { enum: ['manual', 'url', 'image', 'video-upload', 'text'] },
    url: { bsonType: 'string' },
    platform: { enum: ['tiktok', 'instagram', 'youtube', 'facebook', 'web'] },
    importTaskId: { bsonType: 'objectId' },
  },
};

// Keep in sync with RecipeDoc in db/types.ts.
export const recipesValidator: CollectionValidator = {
  validationLevel: 'strict',
  validationAction: 'error',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: [
        'ownerId',
        'title',
        'ingredients',
        'steps',
        'tags',
        'language',
        'source',
        'visibility',
        'createdAt',
        'updatedAt',
      ],
      properties: {
        ownerId: { bsonType: 'objectId' },
        title: { bsonType: 'string' },
        description: { bsonType: 'string' },
        coverImageUrl: { bsonType: 'string' },
        ingredients,
        steps,
        servings: { bsonType: 'int' },
        prepTimeMinutes: { bsonType: 'int' },
        cookTimeMinutes: { bsonType: 'int' },
        difficulty: { enum: ['easy', 'medium', 'hard'] },
        cuisine: { bsonType: 'string' },
        tags: { bsonType: 'array', items: { bsonType: 'string' } },
        language: { enum: ['he', 'en'] },
        source,
        visibility: { enum: ['private', 'unlisted', 'public'] },
        // Added with the draft-status feature. Not required: the mapper
        // treats legacy docs without it as 'published'.
        status: { enum: ['draft', 'published'] },
        forkedFrom: { bsonType: 'objectId' },
        forkedAt: { bsonType: 'date' },
        embedding: { bsonType: 'array', items: { bsonType: ['double', 'int'] } },
        embeddingIndexedAt: { bsonType: 'date' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' },
      },
    },
  },
};
