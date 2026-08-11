import { describe, expect, it } from 'vitest';
import { ObjectId } from 'mongodb';
import { toRecipeBook } from '../recipe-books.mapper.js';
import type { RecipeBookDoc } from '../../../db/types.js';

const OWNER_ID = new ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa');
const MEMBER_ID = new ObjectId('bbbbbbbbbbbbbbbbbbbbbbbb');
const INVITER_ID = new ObjectId('cccccccccccccccccccccccc');
const RECIPE_ID = new ObjectId('dddddddddddddddddddddddd');
const BOOK_ID = new ObjectId('eeeeeeeeeeeeeeeeeeeeeeee');

const now = new Date('2026-01-01T00:00:00.000Z');
const later = new Date('2026-06-01T00:00:00.000Z');

function makeDoc(overrides: Partial<RecipeBookDoc> = {}): RecipeBookDoc {
  return {
    _id: BOOK_ID,
    ownerId: OWNER_ID,
    name: 'ספר המשפחה',
    type: 'personal',
    language: 'he',
    members: [
      { userId: OWNER_ID, role: 'owner', addedAt: now },
    ],
    recipeIds: [RECIPE_ID],
    tags: ['שבת', 'חגים'],
    createdAt: now,
    updatedAt: later,
    ...overrides,
  };
}

describe('toRecipeBook', () => {
  it('converts ObjectId fields to strings', () => {
    const result = toRecipeBook(makeDoc());
    expect(result.id).toBe('eeeeeeeeeeeeeeeeeeeeeeee');
    expect(result.ownerId).toBe('aaaaaaaaaaaaaaaaaaaaaaaa');
    expect(result.recipeIds).toEqual(['dddddddddddddddddddddddd']);
  });

  it('converts dates to ISO strings', () => {
    const result = toRecipeBook(makeDoc());
    expect(result.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(result.updatedAt).toBe('2026-06-01T00:00:00.000Z');
  });

  it('maps all core fields correctly', () => {
    const result = toRecipeBook(makeDoc());
    expect(result.name).toBe('ספר המשפחה');
    expect(result.type).toBe('personal');
    expect(result.tags).toEqual(['שבת', 'חגים']);
  });

  it('maps members array — converts userId and addedAt, preserves role', () => {
    const result = toRecipeBook(makeDoc());
    expect(result.members).toHaveLength(1);
    expect(result.members[0]!.userId).toBe('aaaaaaaaaaaaaaaaaaaaaaaa');
    expect(result.members[0]!.role).toBe('owner');
    expect(result.members[0]!.addedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('converts invitedBy in members when present', () => {
    const result = toRecipeBook(
      makeDoc({
        members: [{ userId: MEMBER_ID, role: 'editor', addedAt: now, invitedBy: INVITER_ID }],
      }),
    );
    expect(result.members[0]!.invitedBy).toBe('cccccccccccccccccccccccc');
  });

  it('leaves invitedBy undefined when not set', () => {
    const result = toRecipeBook(makeDoc());
    expect(result.members[0]!.invitedBy).toBeUndefined();
  });

  it('includes isFavorite when provided in opts', () => {
    const result = toRecipeBook(makeDoc(), { isFavorite: true });
    expect(result.isFavorite).toBe(true);
  });

  it('omits isFavorite when not provided in opts', () => {
    const result = toRecipeBook(makeDoc());
    expect('isFavorite' in result).toBe(false);
  });

  it('returns empty recipeIds array for a book with no recipes', () => {
    const result = toRecipeBook(makeDoc({ recipeIds: [] }));
    expect(result.recipeIds).toEqual([]);
  });

  it('passes optional coverImageUrl and coverKey through', () => {
    const result = toRecipeBook(
      makeDoc({ coverImageUrl: 'https://example.com/cover.jpg', coverKey: 'rbc3' }),
    );
    expect(result.coverImageUrl).toBe('https://example.com/cover.jpg');
    expect(result.coverKey).toBe('rbc3');
  });
});
