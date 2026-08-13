//apps/api/src/modules/recipes/recipes.utils.ts
import type { RecipeDoc } from '../../db/types.js';

export function canRead(
  req: { user?: { id: string; role?: string } },
  doc: RecipeDoc,
): boolean {
  if (doc.visibility !== 'private') return true;
  return req.user?.id === doc.ownerId.toString();
}

/**
 * Returns true when a recipe tag matches a category's slug or label.
 * Matching is case-insensitive and allows partial containment in either direction
 * (e.g. "קינוח" matches "קינוחים", "pasta" matches the "Pasta" category).
 */
export function tagMatchesCategory(tag: string, keys: string[]): boolean {
  const normalizedTag = tag.trim().toLowerCase();
  return keys.some(
    (k) => k.length > 1 && (k === normalizedTag || k.includes(normalizedTag) || normalizedTag.includes(k)),
  );
}
