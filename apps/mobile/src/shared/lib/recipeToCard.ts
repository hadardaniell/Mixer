import type { Recipe } from '@mixer/contracts';

import type { RecipeCardData } from '@/shared/ui/RecipeCard';

/**
 * Maps an API recipe to the feed-card shape. Pass a resolved `tag` (e.g. the
 * localized category labels); when omitted it falls back to the first free-text
 * tag so legacy recipes still render a subtitle.
 */
export function recipeToCard(r: Recipe, tag?: string): RecipeCardData & { isFavorite: boolean } {
  const totalTime = (r.prepTimeMinutes ?? 0) + (r.cookTimeMinutes ?? 0) || undefined;
  return {
    id: r.id,
    name: r.title,
    imageUrl: r.coverImageUrl,
    durationMinutes: totalTime,
    tag: tag ?? r.tags[0],
    isFavorite: r.isFavorite ?? false,
  };
}
