// apps/api/src/modules/favorites/favorites.service.ts
import { ObjectId } from 'mongodb';
import type { Collections } from '../../plugins/mongo.js';
import type { FavoriteKind } from '@mixer/contracts';

/**
 * Given a set of target ids, return the subset the user has favorited
 * for the given kind. Used to annotate listings with isFavorite.
 */
export async function favoritedIds(
  collections: Collections,
  userId: string,
  kind: FavoriteKind,
  targetIds: ObjectId[],
): Promise<Set<string>> {
  if (targetIds.length === 0) return new Set();
  const docs = await collections.favorites
    .find(
      { userId: new ObjectId(userId), kind, targetId: { $in: targetIds } },
      { projection: { targetId: 1 } },
    )
    .toArray();
  return new Set(docs.map((d) => d.targetId.toString()));
}
