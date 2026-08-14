//apps/api/src/modules/recipes/recipes.utils.ts
import type { Collection, Filter, ObjectId } from 'mongodb';

import type { FavoriteDoc, RecipeBookDoc, RecipeDoc, SharedItemDoc } from '../../db/types.js';

/**
 * The recipes a signed-in user can actually reach, as a Mongo filter.
 *
 * This is the *browsing* scope, and it is deliberately narrower than `canRead`
 * below. `canRead` answers "may this person open this document if handed the
 * link" — and for anything not `private`, the answer is yes. Search and category
 * browsing asked that same question, which quietly turned them into a catalogue
 * of every public recipe in the database from people the user has never met.
 *
 * What they should mirror instead is the home feed, which never asks the server
 * for "recipes" at all: it is assembled entirely from the user's own
 * relationships. So the four arms below are exactly the feed's four sources.
 * Anything visible there is findable here, and nothing else is.
 *
 * Note this means a public recipe is reachable by URL but not by search — that
 * is the intent, not an oversight.
 */
export async function visibleRecipeFilter(
  collections: {
    recipeBooks: Collection<RecipeBookDoc>;
    sharedItems: Collection<SharedItemDoc>;
    favorites: Collection<FavoriteDoc>;
  },
  userId: ObjectId,
): Promise<Filter<RecipeDoc>> {
  // One round trip each, in parallel — they are independent lookups and the
  // slowest of the three sets the latency, not their sum.
  const [memberBooks, directShares, favorites] = await Promise.all([
    // Books I own or am a member of. Recipes a friend added to a shared book
    // arrive this way.
    collections.recipeBooks
      .find({ $or: [{ ownerId: userId }, { 'members.userId': userId }] })
      .project<{ recipeIds?: ObjectId[] }>({ recipeIds: 1 })
      .toArray(),
    // Recipes shared with me directly, belonging to no book of mine. Only
    // accepted ones: a pending share is an invitation, not access.
    collections.sharedItems
      .find({ friendId: userId, resourceType: 'recipe', status: 'accepted' })
      .project<{ resourceId: ObjectId }>({ resourceId: 1 })
      .toArray(),
    // Someone else's public recipe I favourited. It sits on my feed under
    // "favourites", so it has to stay findable.
    collections.favorites
      .find({ userId, kind: 'recipe' })
      .project<{ targetId: ObjectId }>({ targetId: 1 })
      .toArray(),
  ]);

  const reachableIds = [
    ...memberBooks.flatMap((b) => b.recipeIds ?? []),
    ...directShares.map((s) => s.resourceId),
    ...favorites.map((f) => f.targetId),
  ];

  return {
    $or: [
      { ownerId: userId },
      ...(reachableIds.length ? [{ _id: { $in: reachableIds } }] : []),
    ],
  };
}

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
