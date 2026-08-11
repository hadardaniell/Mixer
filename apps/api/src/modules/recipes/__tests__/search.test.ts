import { describe, expect, it } from 'vitest';
import { cosineSimilarity, escapeRegex, applySearchFilter } from '../search.utils.js';

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1.0);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0.0);
  });

  it('returns 0 when either vector is all zeros', () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
    expect(cosineSimilarity([1, 2, 3], [0, 0, 0])).toBe(0);
  });

  it('computes correct similarity for known vectors', () => {
    // [1,0] vs [1,1] → dot=1, |a|=1, |b|=√2 → 1/√2 ≈ 0.707
    expect(cosineSimilarity([1, 0], [1, 1])).toBeCloseTo(0.707, 2);
  });

  it('is symmetric — order of arguments does not change the result', () => {
    const a = [0.5, 0.3, 0.8];
    const b = [0.1, 0.9, 0.4];
    expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a));
  });
});

describe('semantic search threshold (0.5)', () => {
  type Scored = { score: number; label: string };

  function applyThreshold(items: Scored[], threshold = 0.5): Scored[] {
    return items.filter(({ score }) => score >= threshold);
  }

  it('includes results at exactly the threshold', () => {
    const results = applyThreshold([{ score: 0.5, label: 'exact' }]);
    expect(results).toHaveLength(1);
  });

  it('excludes results below the threshold', () => {
    const results = applyThreshold([{ score: 0.49, label: 'too low' }]);
    expect(results).toHaveLength(0);
  });

  it('keeps only relevant results from a mixed list', () => {
    const items: Scored[] = [
      { score: 0.9, label: 'very relevant' },
      { score: 0.6, label: 'relevant' },
      { score: 0.5, label: 'borderline' },
      { score: 0.49, label: 'below threshold' },
      { score: 0.1, label: 'irrelevant' },
    ];
    const results = applyThreshold(items);
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.label)).toEqual(['very relevant', 'relevant', 'borderline']);
  });

  it('returns empty list when all results are below threshold', () => {
    const items: Scored[] = [
      { score: 0.3, label: 'low' },
      { score: 0.1, label: 'very low' },
    ];
    expect(applyThreshold(items)).toHaveLength(0);
  });

  it('returns empty list when input is empty', () => {
    expect(applyThreshold([])).toHaveLength(0);
  });
});

describe('escapeRegex', () => {
  it('escapes special regex characters', () => {
    expect(escapeRegex('a.b')).toBe('a\\.b');
    expect(escapeRegex('(test)')).toBe('\\(test\\)');
    expect(escapeRegex('a+b*c')).toBe('a\\+b\\*c');
  });

  it('leaves plain Hebrew and Latin text unchanged', () => {
    expect(escapeRegex('פסטה')).toBe('פסטה');
    expect(escapeRegex('pasta')).toBe('pasta');
  });

  it('escapes a backslash', () => {
    expect(escapeRegex('a\\b')).toBe('a\\\\b');
  });

  it('handles an empty string', () => {
    expect(escapeRegex('')).toBe('');
  });
});

describe('applySearchFilter', () => {
  it('adds $or when filter has no existing $or', () => {
    const filter = { status: { $ne: 'draft' } };
    const result = applySearchFilter(filter, 'פסטה');
    expect(result.$or).toBeDefined();
    expect(result.$and).toBeUndefined();
    const conditions = result.$or as Array<Record<string, unknown>>;
    expect(conditions.some((c) => 'title' in c)).toBe(true);
    expect(conditions.some((c) => 'tags' in c)).toBe(true);
    expect(conditions.some((c) => 'description' in c)).toBe(true);
  });

  it('wraps both $or clauses in $and when filter already has a $or (visibility conflict)', () => {
    // This is the critical case: the visibility filter uses $or, and adding a second
    // $or for search would overwrite it — instead we must wrap both in $and.
    const filter = {
      $or: [{ ownerId: 'abc' }, { visibility: { $ne: 'private' } }],
    };
    const result = applySearchFilter(filter, 'פסטה');

    expect(result.$or).toBeUndefined();
    expect(result.$and).toBeDefined();
    const and = result.$and as Array<Record<string, unknown>>;
    expect(and).toHaveLength(2);
    // First branch preserves the original visibility $or
    expect(and[0]).toHaveProperty('$or');
    // Second branch contains the search $or
    expect(and[1]).toHaveProperty('$or');
  });

  it('escapes special characters in the query before building $regex', () => {
    const result = applySearchFilter({}, 'עוף (מבושל)');
    const conditions = result.$or as Array<Record<string, unknown>>;
    const titleCondition = conditions.find((c) => 'title' in c) as { title: { $regex: string } };
    expect(titleCondition.title.$regex).toBe('עוף \\(מבושל\\)');
  });

  it('does not mutate the original filter object', () => {
    const filter = { status: { $ne: 'draft' } };
    applySearchFilter(filter, 'פסטה');
    expect(filter).not.toHaveProperty('$or');
  });
});
