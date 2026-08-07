/**
 * Executes an async operation with automatic exponential backoff retries.
 * Useful for handling transient rate limits (429), server hiccups (503),
 * network drops, or temporary LLM output formatting errors.
 */
export async function retryWithBackoff<T>(
  fn: (attempt: number) => Promise<T>,
  options: {
    retries?: number;
    initialDelayMs?: number;
    factor?: number;
    onRetry?: (error: unknown, attempt: number) => void;
  } = {},
): Promise<T> {
  const retries = options.retries ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 1000;
  const factor = options.factor ?? 2;

  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;

      const delayMs = initialDelayMs * Math.pow(factor, attempt - 1);
      if (options.onRetry) {
        options.onRetry(err, attempt);
      } else {
        console.warn(
          `⚠️ [retryWithBackoff] Attempt ${attempt}/${retries} failed (${
            err instanceof Error ? err.message : String(err)
          }). Retrying in ${delayMs}ms...`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

/**
 * Strips markdown code block wrappers (e.g. ```json ... ```) from LLM output.
 */
export function sanitizeJsonResponse(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim();
  }
  return cleaned;
}

/**
 * Recursively strips null values from an object or array so optional Zod properties
 * (which expect `number | undefined` rather than `null`) parse cleanly.
 */
export function cleanNullValues<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(cleanNullValues) as T;
  }
  if (typeof obj === 'object' && obj !== null) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null) {
        cleaned[key] = cleanNullValues(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}
