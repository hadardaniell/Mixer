// apps/api/src/modules/recipes/recipes.mapper.ts
import type { Recipe, RecipeSummary } from '@mixer/contracts';
import type { RecipeDoc } from '../../db/types.js';

/** A recipe doc read back under {@link RECIPE_SUMMARY_PROJECTION}. */
export type RecipeSummaryDoc = Omit<RecipeDoc, 'ingredients' | 'steps'>;

/**
 * Keeps the two largest fields of a recipe out of the query entirely, so a
 * listing costs the server no more to read than it costs the client to render.
 */
export const RECIPE_SUMMARY_PROJECTION = { ingredients: 0, steps: 0 } as const;

export function toRecipeSummary(
  doc: RecipeSummaryDoc,
  opts: { isFavorite?: boolean } = {},
): RecipeSummary {
  return {
    ...(opts.isFavorite !== undefined ? { isFavorite: opts.isFavorite } : {}),
    id: doc._id.toString(),
    ownerId: doc.ownerId.toString(),
    title: doc.title,
    description: doc.description,
    coverImageUrl: doc.coverImageUrl,
    servings: doc.servings,
    prepTimeMinutes: doc.prepTimeMinutes,
    cookTimeMinutes: doc.cookTimeMinutes,
    difficulty: doc.difficulty,
    cuisine: doc.cuisine,
    tags: doc.tags,
    categoryIds: (doc.categoryIds ?? []).map((id) => id.toString()),
    language: doc.language,
    source: {
      type: doc.source.type,
      url: doc.source.url,
      platform: doc.source.platform,
      importTaskId: doc.source.importTaskId?.toString(),
    },
    visibility: doc.visibility,
    status: doc.status ?? 'published',
    forkedFrom: doc.forkedFrom?.toString(),
    forkedAt: doc.forkedAt?.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toRecipe(doc: RecipeDoc, opts: { isFavorite?: boolean } = {}): Recipe {
  return {
    ...(opts.isFavorite !== undefined ? { isFavorite: opts.isFavorite } : {}),
    id: doc._id.toString(),
    ownerId: doc.ownerId.toString(),
    title: doc.title,
    description: doc.description,
    coverImageUrl: doc.coverImageUrl,
    ingredients: doc.ingredients,
    steps: doc.steps,
    servings: doc.servings,
    prepTimeMinutes: doc.prepTimeMinutes,
    cookTimeMinutes: doc.cookTimeMinutes,
    difficulty: doc.difficulty,
    cuisine: doc.cuisine,
    tags: doc.tags,
    categoryIds: (doc.categoryIds ?? []).map((id) => id.toString()),
    language: doc.language,
    source: {
      type: doc.source.type,
      url: doc.source.url,
      platform: doc.source.platform,
      importTaskId: doc.source.importTaskId?.toString(),
    },
    visibility: doc.visibility,
    // Legacy docs may predate the status field — treat them as published.
    status: doc.status ?? 'published',
    forkedFrom: doc.forkedFrom?.toString(),
    forkedAt: doc.forkedAt?.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
