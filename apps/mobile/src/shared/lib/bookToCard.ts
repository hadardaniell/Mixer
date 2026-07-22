import type { RecipeBook } from '@mixer/contracts';

import type { BookCardData } from '@/shared/ui/BookCard';

/** Maps an API recipe-book to the feed-card shape (without member previews). */
export function bookToCard(b: RecipeBook): BookCardData {
  return {
    id: b.id,
    name: b.name,
    recipeCount: b.recipeIds.length,
    coverKey: b.coverKey,
    coverImageUrl: b.coverImageUrl,
    members: [],
  };
}
