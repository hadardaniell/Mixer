import { z } from 'zod';

/**
 * Shared contract for the hello-world endpoint.
 * Used by:
 *   - @mixer/api   to validate its outgoing response
 *   - @mixer/mobile to validate the incoming response
 *
 * This file is the single source of truth for types that cross app boundaries.
 * Real schemas (User, Recipe, RecipeBook, ImportJob, ...) will be added here
 * in later sessions once the DB models are finalized.
 */
export const HelloResponseSchema = z.object({
  message: z.string(),
});

export type HelloResponse = z.infer<typeof HelloResponseSchema>;

export const HealthResponseSchema = z.object({
  ok: z.boolean(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
