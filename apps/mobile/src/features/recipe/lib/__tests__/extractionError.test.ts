import { describe, expect, it } from 'vitest';

import { describeExtractionError } from '../extractionError';

/** Shaped like the `HttpError` the http client throws, without dragging it in. */
const failure = (body: unknown, status = 422) => ({ status, path: '/recipes/import/url', body });

describe('describeExtractionError', () => {
  it('explains a page that had no recipe on it', () => {
    expect(describeExtractionError(failure({ code: 'not_a_recipe' }))).toEqual({
      key: 'newRecipe.errors.notARecipe',
      params: undefined,
    });
  });

  it('passes the durations through so the message can name them', () => {
    const body = { code: 'video_too_long', params: { actualMinutes: 31, maxMinutes: 5 } };
    expect(describeExtractionError(failure(body))).toEqual({
      key: 'newRecipe.errors.videoTooLong',
      params: { actualMinutes: 31, maxMinutes: 5 },
    });
  });

  it('explains a source we could not read at all', () => {
    expect(describeExtractionError(failure({ code: 'source_unreachable' })).key).toBe(
      'newRecipe.errors.sourceUnreachable',
    );
  });

  it('treats a non-HTTP throw as being offline — there was no response to read', () => {
    expect(describeExtractionError(new TypeError('Network request failed')).key).toBe(
      'newRecipe.errors.offline',
    );
  });

  it('falls back to the generic message for a code it does not know', () => {
    expect(describeExtractionError(failure({ code: 'something_new' })).key).toBe(
      'newRecipe.errors.extractFailed',
    );
  });

  it('falls back when the server sent no code at all', () => {
    expect(describeExtractionError(failure({ error: 'boom' })).key).toBe(
      'newRecipe.errors.extractFailed',
    );
    expect(describeExtractionError(failure(undefined, 500)).key).toBe(
      'newRecipe.errors.extractFailed',
    );
  });

  it('never reads the English prose the server sends alongside the code', () => {
    const reworded = failure({ code: 'not_a_recipe', error: 'totally different wording' });
    expect(describeExtractionError(reworded).key).toBe('newRecipe.errors.notARecipe');
  });
});
