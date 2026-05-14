import type { Recipe } from '@mixer/contracts';
import type { RecipeDoc } from '../../db/types.js';

export function toRecipe(doc: RecipeDoc): Recipe {
  return {
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
    language: doc.language,
    source: {
      type: doc.source.type,
      url: doc.source.url,
      platform: doc.source.platform,
      importTaskId: doc.source.importTaskId?.toString(),
    },
    visibility: doc.visibility,
    forkedFrom: doc.forkedFrom?.toString(),
    forkedAt: doc.forkedAt?.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
