import type { Document } from 'mongodb';

/**
 * Source of truth for the MongoDB collection `$jsonSchema` validators.
 *
 * These used to live only in Atlas, hand-edited in the shell, and drifted out
 * of sync with the document shapes in `db/types.ts` (a missing field or a wrong
 * bsonType surfaces only at runtime as `Document failed validation`, code 121).
 * They are now reconciled on API startup by `ensureValidators` in the mongo
 * plugin, so the schema travels with the code and is covered by review.
 *
 * Keep each schema in sync with the matching `*Doc` type in `db/types.ts`.
 * The validators are a defense-in-depth backstop against every writer (this
 * API, migrations, a future worker, a manual mongosh fix) — not a replacement
 * for the Zod input validation at the HTTP boundary.
 *
 * Keys are the real collection names (snake_case), matching the names passed to
 * `db.collection(...)` in the mongo plugin.
 */

export type CollectionValidator = {
  validator: Document;
  validationLevel: 'off' | 'moderate' | 'strict';
  validationAction: 'warn' | 'error';
};

// Reused by the recipe ingredient/step/source sub-documents.
const recipeIngredients: Document = {
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

const recipeSteps: Document = {
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

const recipeSource: Document = {
  bsonType: 'object',
  required: ['type'],
  properties: {
    type: { enum: ['manual', 'url', 'image', 'video-upload', 'text'] },
    url: { bsonType: 'string' },
    platform: { enum: ['tiktok', 'instagram', 'youtube', 'facebook', 'web'] },
    importTaskId: { bsonType: 'objectId' },
  },
};

export const collectionValidators: Record<string, CollectionValidator> = {
  users: {
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
  },

  refresh_tokens: {
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
  },

  recipes: {
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
          ingredients: recipeIngredients,
          steps: recipeSteps,
          servings: { bsonType: 'int' },
          prepTimeMinutes: { bsonType: 'int' },
          cookTimeMinutes: { bsonType: 'int' },
          difficulty: { enum: ['easy', 'medium', 'hard'] },
          cuisine: { bsonType: 'string' },
          tags: { bsonType: 'array', items: { bsonType: 'string' } },
          language: { enum: ['he', 'en'] },
          source: recipeSource,
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
  },

  recipe_books: {
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
          'createdAt',
          'updatedAt',
        ],
        properties: {
          ownerId: { bsonType: 'objectId' },
          name: { bsonType: 'string' },
          description: { bsonType: 'string' },
          coverImageUrl: { bsonType: 'string' },
          type: { enum: ['personal', 'shared', 'meal'] },
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
          createdAt: { bsonType: 'date' },
          updatedAt: { bsonType: 'date' },
        },
      },
    },
  },

  favorites: {
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
  },
};
