import type { RecipeBook } from '@mixer/contracts';
import type { RecipeBookDoc } from '../../db/types.js';

export function toRecipeBook(doc: RecipeBookDoc, opts: { isFavorite?: boolean } = {}): RecipeBook {
  return {
    ...(opts.isFavorite !== undefined ? { isFavorite: opts.isFavorite } : {}),
    id: doc._id.toString(),
    ownerId: doc.ownerId.toString(),
    name: doc.name,
    description: doc.description,
    coverImageUrl: doc.coverImageUrl,
    coverKey: doc.coverKey,
    type: doc.type,
    members: doc.members.map((m) => ({
      userId: m.userId.toString(),
      role: m.role,
      addedAt: m.addedAt.toISOString(),
      invitedBy: m.invitedBy?.toString(),
    })),
    recipeIds: doc.recipeIds.map((id) => id.toString()),
    tags: doc.tags,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
