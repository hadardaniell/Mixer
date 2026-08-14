import { ExtractFailureCodeSchema } from '@mixer/contracts';

/** A translation key plus whatever it needs interpolated. */
export interface ExtractionErrorMessage {
  key: string;
  params?: Record<string, string | number>;
}

const KEY_BY_CODE: Record<string, string> = {
  not_a_recipe: 'newRecipe.errors.notARecipe',
  video_too_long: 'newRecipe.errors.videoTooLong',
  source_unreachable: 'newRecipe.errors.sourceUnreachable',
};

/**
 * A failed response, recognised by shape rather than by `instanceof HttpError`.
 *
 * Deliberate: importing that class pulls `httpClient` — and through it
 * react-native and expo-constants — into the module graph, which no unit test
 * can load. A mapper this small should be testable, and what it actually cares
 * about is the shape of a failure body, not which class carried it.
 */
function isHttpFailure(error: unknown): error is { status: number; body?: unknown } {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as { status?: unknown }).status === 'number'
  );
}

/**
 * Works out what to tell someone whose import just failed.
 *
 * Every failure used to arrive as the same sentence — "we couldn't extract the
 * recipe, please try again" — which is unhelpful exactly when it matters: "try
 * again" is wrong advice for a page that has no recipe on it, and for a video
 * that is thirty minutes long it is wrong forever.
 *
 * The server's `code` decides the message; the English prose sent beside it is
 * never read, so server copy can change without silently breaking a translation
 * here. Anything unrecognised falls back to the generic line, which is the
 * honest answer: we don't know what happened.
 */
export function describeExtractionError(error: unknown): ExtractionErrorMessage {
  // No response at all — aeroplane mode, dead wifi, server unreachable. `fetch`
  // rejects with a TypeError rather than returning a status.
  if (!isHttpFailure(error)) return { key: 'newRecipe.errors.offline' };

  const body = error.body as
    | { code?: unknown; params?: Record<string, string | number> }
    | undefined;

  const code = ExtractFailureCodeSchema.safeParse(body?.code);
  if (!code.success) return { key: 'newRecipe.errors.extractFailed' };

  return { key: KEY_BY_CODE[code.data] ?? 'newRecipe.errors.extractFailed', params: body?.params };
}
