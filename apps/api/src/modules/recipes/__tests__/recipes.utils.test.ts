import { describe, expect, it } from 'vitest';
import { ObjectId } from 'mongodb';
import { canRead, tagMatchesCategory } from '../recipes.utils.js';
import type { RecipeDoc } from '../../../db/types.js';

function makeDoc(overrides: Partial<RecipeDoc> = {}): RecipeDoc {
  const ownerId = new ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa');
  return {
    _id: new ObjectId(),
    ownerId,
    title: 'פסטה',
    ingredients: [],
    steps: [],
    tags: [],
    language: 'he',
    source: { type: 'manual' },
    visibility: 'private',
    status: 'published',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('canRead', () => {
  const ownerId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
  const otherId = 'bbbbbbbbbbbbbbbbbbbbbbbb';

  it('allows anyone to read a public recipe', () => {
    const doc = makeDoc({ visibility: 'public' });
    expect(canRead({}, doc)).toBe(true);
    expect(canRead({ user: { id: otherId } }, doc)).toBe(true);
  });

  it('allows anyone to read an unlisted recipe', () => {
    const doc = makeDoc({ visibility: 'unlisted' });
    expect(canRead({}, doc)).toBe(true);
    expect(canRead({ user: { id: otherId } }, doc)).toBe(true);
  });

  it('allows the owner to read their own private recipe', () => {
    const doc = makeDoc({ visibility: 'private' });
    expect(canRead({ user: { id: ownerId } }, doc)).toBe(true);
  });

  it('blocks a different user from reading a private recipe', () => {
    const doc = makeDoc({ visibility: 'private' });
    expect(canRead({ user: { id: otherId } }, doc)).toBe(false);
  });

  it('blocks a guest (unauthenticated) from reading a private recipe', () => {
    const doc = makeDoc({ visibility: 'private' });
    expect(canRead({}, doc)).toBe(false);
  });
});

describe('tagMatchesCategory', () => {
  it('matches when tag equals a key exactly (case-insensitive)', () => {
    expect(tagMatchesCategory('pasta', ['pasta', 'פסטה', 'pasta'])).toBe(true);
    expect(tagMatchesCategory('PASTA', ['pasta', 'פסטה', 'pasta'])).toBe(true);
  });

  it('matches when a key contains the tag (category is broader)', () => {
    // "קינוחים" (desserts) contains "קינוח" (dessert) — singular maps to plural category
    expect(tagMatchesCategory('קינוח', ['desserts', 'קינוחים', 'dessert'])).toBe(true);
  });

  it('matches when the tag contains a key (tag is broader)', () => {
    // "pasta" category matches "pasta primavera" tag
    expect(tagMatchesCategory('pasta primavera', ['pasta', 'פסטה', 'pasta'])).toBe(true);
  });

  it('does not match when there is no overlap', () => {
    expect(tagMatchesCategory('עוף', ['pasta', 'פסטה', 'pasta'])).toBe(false);
  });

  it('ignores single-character keys to avoid false positives', () => {
    // Keys of length 1 are skipped — only the keys are guarded, not the tag itself
    expect(tagMatchesCategory('pasta', ['a', 'b'])).toBe(false);
    expect(tagMatchesCategory('pasta', ['a', 'pasta'])).toBe(true);
  });

  it('trims whitespace from the tag before matching', () => {
    expect(tagMatchesCategory('  pasta  ', ['pasta', 'פסטה', 'pasta'])).toBe(true);
  });

  it('returns false for an empty keys array', () => {
    expect(tagMatchesCategory('pasta', [])).toBe(false);
  });
});
