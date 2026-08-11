import { describe, expect, it } from 'vitest';
import { mergeSearchResults } from '../lib/mergeSearchResults';

type Item = { id: string; title: string };

const pasta: Item = { id: '1', title: 'פסטה ברוטב עגבניות' };
const mushroom: Item = { id: '2', title: 'מרק פטריות' };
const salad: Item = { id: '3', title: 'סלט ירקות' };

describe('mergeSearchResults', () => {
  it('places semantic results before text results', () => {
    const result = mergeSearchResults([mushroom], [pasta]);
    expect(result[0]!.id).toBe(mushroom.id);
    expect(result[1]!.id).toBe(pasta.id);
  });

  it('deduplicates — a recipe in both lists appears only once', () => {
    const result = mergeSearchResults([pasta, mushroom], [pasta, salad]);
    expect(result).toHaveLength(3);
    expect(result.filter((r) => r.id === pasta.id)).toHaveLength(1);
  });

  it('returns only text results when semantic list is empty', () => {
    const result = mergeSearchResults([], [pasta, mushroom]);
    expect(result).toEqual([pasta, mushroom]);
  });

  it('returns only semantic results when text list is empty', () => {
    const result = mergeSearchResults([pasta, mushroom], []);
    expect(result).toEqual([pasta, mushroom]);
  });

  it('returns empty list when both lists are empty', () => {
    expect(mergeSearchResults([], [])).toEqual([]);
  });

  it('preserves semantic order even when text order differs', () => {
    const result = mergeSearchResults([salad, pasta, mushroom], [mushroom, pasta, salad]);
    // All three are already in semantic — nothing new appended
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.id)).toEqual([salad.id, pasta.id, mushroom.id]);
  });

  it('appends only the text-exclusive items in their original text order', () => {
    const result = mergeSearchResults([pasta], [mushroom, salad, pasta]);
    // pasta already seen → mushroom and salad appended in text order
    expect(result.map((r) => r.id)).toEqual([pasta.id, mushroom.id, salad.id]);
  });
});
