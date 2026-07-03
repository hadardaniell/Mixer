import type { CreateRecipeInput, ExtractFromTextResult, RecipeSourceTypeSchema } from '@mixer/contracts';
import type { z } from 'zod';

type SourceType = z.infer<typeof RecipeSourceTypeSchema>;

/**
 * Turns an AI extraction result into a CreateRecipeInput. Missing fields fall
 * back to sane defaults; the recipe is created as a private draft so the user
 * can review/edit it before publishing.
 */
export function mapExtraction(
  result: ExtractFromTextResult,
  language: 'he' | 'en',
  sourceType: SourceType,
  fallbackTitle: string,
): CreateRecipeInput {
  return {
    title: result.title?.trim() || fallbackTitle,
    description: result.description,
    ingredients: result.ingredients ?? [],
    steps: result.steps ?? [],
    servings: result.servings,
    prepTimeMinutes: result.prepTimeMinutes,
    cookTimeMinutes: result.cookTimeMinutes,
    difficulty: result.difficulty,
    cuisine: result.cuisine,
    tags: result.tags ?? [],
    categoryIds: [],
    language,
    source: { type: sourceType },
    visibility: 'private',
    status: 'draft',
  };
}
