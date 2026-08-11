import { describe, expect, it, vi } from 'vitest';
import { sanitizeJsonResponse, cleanNullValues, retryWithBackoff } from '../retry.utils.js';

describe('sanitizeJsonResponse', () => {
  it('strips ```json ... ``` markdown wrapper', () => {
    const input = '```json\n{"title":"פסטה"}\n```';
    expect(sanitizeJsonResponse(input)).toBe('{"title":"פסטה"}');
  });

  it('strips ``` ... ``` wrapper without language tag', () => {
    const input = '```\n{"title":"pasta"}\n```';
    expect(sanitizeJsonResponse(input)).toBe('{"title":"pasta"}');
  });

  it('leaves plain JSON unchanged', () => {
    const input = '{"title":"מרק","servings":4}';
    expect(sanitizeJsonResponse(input)).toBe('{"title":"מרק","servings":4}');
  });

  it('trims surrounding whitespace', () => {
    const input = '  {"title":"עוף"}  ';
    expect(sanitizeJsonResponse(input)).toBe('{"title":"עוף"}');
  });

  it('handles empty string', () => {
    expect(sanitizeJsonResponse('')).toBe('');
  });

  it('does not strip backticks that are mid-string (not a wrapper)', () => {
    const input = '{"note":"use `butter`"}';
    expect(sanitizeJsonResponse(input)).toBe('{"note":"use `butter`"}');
  });
});

describe('cleanNullValues', () => {
  it('removes top-level null fields', () => {
    const input = { title: 'פסטה', servings: null, description: 'טעים' };
    expect(cleanNullValues(input)).toEqual({ title: 'פסטה', description: 'טעים' });
  });

  it('removes null fields from nested objects', () => {
    const input = { step: { text: 'לבשל', durationMinutes: null } };
    expect(cleanNullValues(input)).toEqual({ step: { text: 'לבשל' } });
  });

  it('removes null items inside arrays', () => {
    const input = {
      ingredients: [
        { name: 'מלח', amount: null },
        { name: 'מים', amount: 1 },
      ],
    };
    expect(cleanNullValues(input)).toEqual({
      ingredients: [{ name: 'מלח' }, { name: 'מים', amount: 1 }],
    });
  });

  it('leaves non-null values and zero unchanged', () => {
    const input = { servings: 0, cookTimeMinutes: 30, title: 'מרק' };
    expect(cleanNullValues(input)).toEqual({ servings: 0, cookTimeMinutes: 30, title: 'מרק' });
  });

  it('handles deeply nested nulls', () => {
    const input = { a: { b: { c: null, d: 'ok' } } };
    expect(cleanNullValues(input)).toEqual({ a: { b: { d: 'ok' } } });
  });

  it('returns primitives unchanged', () => {
    expect(cleanNullValues('hello')).toBe('hello');
    expect(cleanNullValues(42)).toBe(42);
    expect(cleanNullValues(true)).toBe(true);
  });
});

describe('retryWithBackoff', () => {
  it('returns the result immediately when the function succeeds on the first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await retryWithBackoff(fn, { retries: 3, initialDelayMs: 0 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries after a failure and returns the result on the second attempt', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValue('recovered');
    const result = await retryWithBackoff(fn, { retries: 3, initialDelayMs: 0 });
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws the last error after exhausting all retries', async () => {
    const error = new Error('permanent failure');
    const fn = vi.fn().mockRejectedValue(error);
    await expect(retryWithBackoff(fn, { retries: 3, initialDelayMs: 0 })).rejects.toThrow(
      'permanent failure',
    );
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('passes the correct attempt number (1-based) to the function', async () => {
    const attempts: number[] = [];
    const fn = vi.fn().mockImplementation(async (attempt: number) => {
      attempts.push(attempt);
      if (attempt < 3) throw new Error('not yet');
      return 'done';
    });
    await retryWithBackoff(fn, { retries: 3, initialDelayMs: 0 });
    expect(attempts).toEqual([1, 2, 3]);
  });

  it('calls onRetry callback on each failed attempt (except the last)', async () => {
    const onRetry = vi.fn();
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('ok');
    await retryWithBackoff(fn, { retries: 3, initialDelayMs: 0, onRetry });
    expect(onRetry).toHaveBeenCalledTimes(2);
  });
});
