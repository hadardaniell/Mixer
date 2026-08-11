import { describe, expect, it } from 'vitest';
import {
  RegisterInputSchema,
  LoginInputSchema,
  PublicUserSchema,
  UpdateOwnUserSchema,
  CreateRecipeInputSchema,
  RecipeListQuerySchema,
  ExtractFromTextResultSchema,
  ExtractFromImageInputSchema,
  CreateShareInputSchema,
  SharedItemSchema,
  ShareListQuerySchema,
} from '../index.js';

describe('Contracts Zod Schemas', () => {
  describe('RegisterInputSchema', () => {
    it('validates a valid user registration input', () => {
      const valid = {
        email: 'user@example.com',
        password: 'securePassword123',
        displayName: 'Chef Mario',
        phoneNumber: '+12345678901',
        locale: 'en',
      };

      const result = RegisterInputSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects an invalid email format', () => {
      const invalid = {
        email: 'not-an-email',
        password: 'securePassword123',
        displayName: 'Chef Mario',
        phoneNumber: '+12345678901',
      };

      const result = RegisterInputSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects password shorter than 8 characters', () => {
      const invalid = {
        email: 'user@example.com',
        password: 'short',
        displayName: 'Chef Mario',
        phoneNumber: '+12345678901',
      };

      const result = RegisterInputSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('LoginInputSchema', () => {
    it('accepts login with email', () => {
      const result = LoginInputSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('accepts login with phone number', () => {
      const result = LoginInputSchema.safeParse({
        phoneNumber: '+1234567890',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects when both email and phone are provided', () => {
      const result = LoginInputSchema.safeParse({
        email: 'user@example.com',
        phoneNumber: '+1234567890',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects when neither email nor phone is provided', () => {
      const result = LoginInputSchema.safeParse({
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('PublicUserSchema', () => {
    it('validates a complete public user object', () => {
      const validUser = {
        id: '507f1f77bcf86cd799439011',
        email: 'test@mixer.com',
        displayName: 'Test User',
        locale: 'he',
        role: 'user',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const result = PublicUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('rejects an invalid ObjectId string', () => {
      const invalidUser = {
        id: 'invalid-id',
        email: 'test@mixer.com',
        displayName: 'Test User',
        locale: 'en',
        role: 'user',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const result = PublicUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe('Recipe Schemas', () => {
    it('validates CreateRecipeInput with default fallbacks', () => {
      const result = CreateRecipeInputSchema.safeParse({
        title: 'חלה לשבת',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('חלה לשבת');
        expect(result.data.visibility).toBe('private');
        expect(result.data.status).toBe('published');
        expect(result.data.language).toBe('en');
        expect(result.data.ingredients).toEqual([]);
      }
    });

    it('parses RecipeListQuery coercion correctly', () => {
      const result = RecipeListQuerySchema.safeParse({
        limit: '50',
        skip: '10',
        owner: 'me',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.skip).toBe(10);
      }
    });
  });

  describe('ExtractFromTextResultSchema', () => {
    it('accepts a full valid recipe from the AI', () => {
      const result = ExtractFromTextResultSchema.safeParse({
        title: 'פסטה ברוטב עגבניות',
        description: 'מתכון קלאסי',
        ingredients: [{ name: 'פסטה', amount: 200, unit: 'גרם' }],
        steps: [{ order: 1, text: 'לבשל את הפסטה', durationMinutes: 10 }],
        servings: 4,
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        difficulty: 'easy',
        cuisine: 'איטלקית',
        tags: ['פסטה', 'ארוחת ערב'],
        coverImageUrl: 'https://images.pexels.com/photos/1/pasta.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('accepts an empty object — all fields are optional (AI may return partial data)', () => {
      const result = ExtractFromTextResultSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts a recipe with only a title', () => {
      const result = ExtractFromTextResultSchema.safeParse({ title: 'חומוס ביתי' });
      expect(result.success).toBe(true);
    });

    it('rejects an invalid difficulty value', () => {
      const result = ExtractFromTextResultSchema.safeParse({
        title: 'פסטה',
        difficulty: 'very hard',
      });
      expect(result.success).toBe(false);
    });

    it('rejects a coverImageUrl that is not a valid URL', () => {
      const result = ExtractFromTextResultSchema.safeParse({
        title: 'פסטה',
        coverImageUrl: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('rejects a step that is missing required "text" field', () => {
      const result = ExtractFromTextResultSchema.safeParse({
        steps: [{ order: 1 }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects an ingredient that is missing required "name" field', () => {
      const result = ExtractFromTextResultSchema.safeParse({
        ingredients: [{ amount: 2, unit: 'כוס' }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Share Schemas', () => {
    const validId = '507f1f77bcf86cd799439011';

    describe('CreateShareInputSchema', () => {
      it('accepts a valid recipe share input', () => {
        const result = CreateShareInputSchema.safeParse({
          resourceType: 'recipe',
          resourceId: validId,
          friendId: validId,
        });
        expect(result.success).toBe(true);
      });

      it('accepts book as resourceType', () => {
        const result = CreateShareInputSchema.safeParse({
          resourceType: 'book',
          resourceId: validId,
          friendId: validId,
        });
        expect(result.success).toBe(true);
      });

      it('rejects an invalid resourceType', () => {
        const result = CreateShareInputSchema.safeParse({
          resourceType: 'playlist',
          resourceId: validId,
          friendId: validId,
        });
        expect(result.success).toBe(false);
      });

      it('rejects a malformed resourceId', () => {
        const result = CreateShareInputSchema.safeParse({
          resourceType: 'recipe',
          resourceId: 'not-an-object-id',
          friendId: validId,
        });
        expect(result.success).toBe(false);
      });

      it('rejects missing friendId', () => {
        const result = CreateShareInputSchema.safeParse({
          resourceType: 'recipe',
          resourceId: validId,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('SharedItemSchema', () => {
      const validItem = {
        id: validId,
        resourceType: 'recipe',
        resourceId: validId,
        resourceName: 'Pasta',
        ownerId: validId,
        ownerName: 'Alice',
        friendId: validId,
        status: 'pending',
        savedAt: null,
        savedResourceId: null,
        createdAt: '2026-01-01T00:00:00.000Z',
      };

      it('accepts a valid pending shared item', () => {
        expect(SharedItemSchema.safeParse(validItem).success).toBe(true);
      });

      it('accepts an accepted item with savedAt and savedResourceId set', () => {
        const result = SharedItemSchema.safeParse({
          ...validItem,
          status: 'accepted',
          savedAt: '2026-03-01T00:00:00.000Z',
          savedResourceId: validId,
        });
        expect(result.success).toBe(true);
      });

      it('accepts rejected status', () => {
        expect(SharedItemSchema.safeParse({ ...validItem, status: 'rejected' }).success).toBe(true);
      });

      it('rejects an invalid status value', () => {
        expect(SharedItemSchema.safeParse({ ...validItem, status: 'cancelled' }).success).toBe(false);
      });

      it('rejects missing resourceName', () => {
        const { resourceName: _, ...rest } = validItem;
        expect(SharedItemSchema.safeParse(rest).success).toBe(false);
      });
    });

    describe('ShareListQuerySchema', () => {
      it('accepts a valid status filter', () => {
        const result = ShareListQuerySchema.safeParse({ status: 'pending' });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.status).toBe('pending');
      });

      it('accepts no status (optional)', () => {
        const result = ShareListQuerySchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.status).toBeUndefined();
      });

      it('coerces limit and skip strings to numbers', () => {
        const result = ShareListQuerySchema.safeParse({ limit: '10', skip: '5' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(10);
          expect(result.data.skip).toBe(5);
        }
      });

      it('applies default limit=20 and skip=0', () => {
        const result = ShareListQuerySchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(20);
          expect(result.data.skip).toBe(0);
        }
      });

      it('rejects an invalid status value', () => {
        expect(ShareListQuerySchema.safeParse({ status: 'expired' }).success).toBe(false);
      });
    });
  });

  describe('ExtractFromImageInputSchema', () => {
    const validImage = {
      imageBase64: 'abc123base64data==',
      mimeType: 'image/jpeg',
    };

    it('accepts a valid jpeg image input', () => {
      const result = ExtractFromImageInputSchema.safeParse({ images: [validImage] });
      expect(result.success).toBe(true);
    });

    it('accepts png and webp mime types', () => {
      expect(
        ExtractFromImageInputSchema.safeParse({
          images: [{ ...validImage, mimeType: 'image/png' }],
        }).success,
      ).toBe(true);
      expect(
        ExtractFromImageInputSchema.safeParse({
          images: [{ ...validImage, mimeType: 'image/webp' }],
        }).success,
      ).toBe(true);
    });

    it('rejects an unsupported mime type', () => {
      const result = ExtractFromImageInputSchema.safeParse({
        images: [{ ...validImage, mimeType: 'image/gif' }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects an empty base64 string', () => {
      const result = ExtractFromImageInputSchema.safeParse({
        images: [{ imageBase64: '', mimeType: 'image/jpeg' }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects an empty images array', () => {
      const result = ExtractFromImageInputSchema.safeParse({ images: [] });
      expect(result.success).toBe(false);
    });

    it('defaults mimeType to image/jpeg when omitted', () => {
      const result = ExtractFromImageInputSchema.safeParse({
        images: [{ imageBase64: 'abc123' }],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.images[0]!.mimeType).toBe('image/jpeg');
      }
    });
  });
});
