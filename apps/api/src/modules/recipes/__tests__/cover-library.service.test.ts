import { describe, expect, it } from 'vitest';

import { toDishKey } from '../cover-library.service.js';

describe('toDishKey', () => {
  it('collapses case, spacing and punctuation to one key', () => {
    expect(toDishKey('Pasta Rosa')).toBe('pasta-rosa');
    expect(toDishKey('pasta  rosa')).toBe('pasta-rosa');
    expect(toDishKey('  Pasta Rosa!  ')).toBe('pasta-rosa');
    expect(toDishKey('Pasta-Rosa')).toBe('pasta-rosa');
  });

  it('keeps genuinely different dishes apart', () => {
    expect(toDishKey('Chocolate loaf cake')).not.toBe(toDishKey('Chocolate mousse cake'));
  });

  it('survives a label the AI returned with quotes or a trailing period', () => {
    expect(toDishKey('"Beef meatballs".')).toBe('beef-meatballs');
  });

  it('does not strip non-Latin letters', () => {
    // The keyword prompt asks for English, but a fallback can return the raw
    // Hebrew title — that must still produce a usable key rather than an empty
    // one, which would disable the library for that recipe.
    expect(toDishKey('עוגת שוקולד')).toBe('עוגת-שוקולד');
  });

  it('returns an empty key for input with nothing to key on', () => {
    expect(toDishKey('!!!')).toBe('');
  });
});
