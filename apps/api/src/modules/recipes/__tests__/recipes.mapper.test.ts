import { describe, expect, it } from 'vitest';
import { ObjectId } from 'mongodb';
import { toRecipe } from '../recipes.mapper.js';
import type { RecipeDoc } from '../../../db/types.js';

function makeDoc(overrides: Partial<RecipeDoc> = {}): RecipeDoc {
  return {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa'),
    ownerId: new ObjectId('bbbbbbbbbbbbbbbbbbbbbbbb'),
    title: 'מרק עוף',
    ingredients: [{ name: 'עוף', amount: 1, unit: 'יחידה' }],
    steps: [{ order: 1, text: 'לבשל' }],
    tags: ['מרק', 'עוף'],
    categoryIds: [new ObjectId('cccccccccccccccccccccccc')],
    language: 'he',
    source: { type: 'manual' },
    visibility: 'private',
    status: 'published',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

describe('toRecipe', () => {
  it('converts ObjectId fields to strings', () => {
    const recipe = toRecipe(makeDoc());
    expect(recipe.id).toBe('aaaaaaaaaaaaaaaaaaaaaaaa');
    expect(recipe.ownerId).toBe('bbbbbbbbbbbbbbbbbbbbbbbb');
    expect(recipe.categoryIds).toEqual(['cccccccccccccccccccccccc']);
  });

  it('converts dates to ISO strings', () => {
    const recipe = toRecipe(makeDoc());
    expect(recipe.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(recipe.updatedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('maps all core fields correctly', () => {
    const recipe = toRecipe(makeDoc());
    expect(recipe.title).toBe('מרק עוף');
    expect(recipe.language).toBe('he');
    expect(recipe.visibility).toBe('private');
    expect(recipe.status).toBe('published');
    expect(recipe.ingredients).toEqual([{ name: 'עוף', amount: 1, unit: 'יחידה' }]);
    expect(recipe.tags).toEqual(['מרק', 'עוף']);
  });

  it('defaults status to "published" for legacy docs without a status field', () => {
    const doc = makeDoc();
    delete (doc as Partial<RecipeDoc>).status;
    const recipe = toRecipe(doc as RecipeDoc);
    expect(recipe.status).toBe('published');
  });

  it('includes isFavorite when provided in opts', () => {
    const recipe = toRecipe(makeDoc(), { isFavorite: true });
    expect(recipe.isFavorite).toBe(true);
  });

  it('omits isFavorite when not provided in opts', () => {
    const recipe = toRecipe(makeDoc());
    expect('isFavorite' in recipe).toBe(false);
  });

  it('converts forkedFrom and forkedAt when present', () => {
    const forkedFrom = new ObjectId('dddddddddddddddddddddddd');
    const forkedAt = new Date('2026-03-01T00:00:00.000Z');
    const recipe = toRecipe(makeDoc({ forkedFrom, forkedAt }));
    expect(recipe.forkedFrom).toBe('dddddddddddddddddddddddd');
    expect(recipe.forkedAt).toBe('2026-03-01T00:00:00.000Z');
  });

  it('leaves forkedFrom and forkedAt as undefined when not set', () => {
    const recipe = toRecipe(makeDoc());
    expect(recipe.forkedFrom).toBeUndefined();
    expect(recipe.forkedAt).toBeUndefined();
  });

  it('converts importTaskId in source when present', () => {
    const importTaskId = new ObjectId('eeeeeeeeeeeeeeeeeeeeeeee');
    const recipe = toRecipe(makeDoc({ source: { type: 'url', importTaskId } }));
    expect(recipe.source.importTaskId).toBe('eeeeeeeeeeeeeeeeeeeeeeee');
  });

  it('returns empty categoryIds array when doc has no categoryIds', () => {
    const recipe = toRecipe(makeDoc({ categoryIds: undefined }));
    expect(recipe.categoryIds).toEqual([]);
  });
});
