import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import type { FavoriteKind } from '@mixer/contracts';
import { toRecipe } from '../recipes/recipes.mapper.js';
import { toRecipeBook } from '../recipe-books/recipe-books.mapper.js';
import type { Collections } from '../../plugins/mongo.js';

const IdParams = {
  recipe: z.object({ recipeId: z.string().regex(/^[a-f0-9]{24}$/i) }),
  book: z.object({ bookId: z.string().regex(/^[a-f0-9]{24}$/i) }),
};

async function addFavorite(
  collections: Collections,
  userId: string,
  kind: FavoriteKind,
  targetId: string,
): Promise<void> {
  await collections.favorites.updateOne(
    { userId: new ObjectId(userId), kind, targetId: new ObjectId(targetId) },
    {
      $setOnInsert: {
        userId: new ObjectId(userId),
        kind,
        targetId: new ObjectId(targetId),
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );
}

async function removeFavorite(
  collections: Collections,
  userId: string,
  kind: FavoriteKind,
  targetId: string,
): Promise<void> {
  await collections.favorites.deleteOne({
    userId: new ObjectId(userId),
    kind,
    targetId: new ObjectId(targetId),
  });
}

export const favoritesRoutes: FastifyPluginAsyncZod = async (app) => {
  // --- recipe favorites ---
  app.post(
    '/favorites/recipes/:recipeId',
    { onRequest: [app.authenticate], schema: { params: IdParams.recipe, tags: ['favorites'] } },
    async (req, reply) => {
      await addFavorite(app.collections, req.user.id, 'recipe', req.params.recipeId);
      return reply.code(204).send();
    },
  );

  app.delete(
    '/favorites/recipes/:recipeId',
    { onRequest: [app.authenticate], schema: { params: IdParams.recipe, tags: ['favorites'] } },
    async (req, reply) => {
      await removeFavorite(app.collections, req.user.id, 'recipe', req.params.recipeId);
      return reply.code(204).send();
    },
  );

  // --- book favorites ---
  app.post(
    '/favorites/books/:bookId',
    { onRequest: [app.authenticate], schema: { params: IdParams.book, tags: ['favorites'] } },
    async (req, reply) => {
      await addFavorite(app.collections, req.user.id, 'book', req.params.bookId);
      return reply.code(204).send();
    },
  );

  app.delete(
    '/favorites/books/:bookId',
    { onRequest: [app.authenticate], schema: { params: IdParams.book, tags: ['favorites'] } },
    async (req, reply) => {
      await removeFavorite(app.collections, req.user.id, 'book', req.params.bookId);
      return reply.code(204).send();
    },
  );

  // --- list my favorited recipes (visibility-aware) ---
  app.get(
    '/favorites/recipes',
    { onRequest: [app.authenticate], schema: { tags: ['favorites'] } },
    async (req) => {
      const userId = new ObjectId(req.user.id);
      const favs = await app.collections.favorites
        .find({ userId, kind: 'recipe' }, { sort: { createdAt: -1 } })
        .toArray();
      const ids = favs.map((f) => f.targetId);
      if (ids.length === 0) return { items: [] };
      const recipes = await app.collections.recipes
        .find({
          _id: { $in: ids },
          $or: [{ ownerId: userId }, { visibility: { $ne: 'private' } }],
        })
        .toArray();
      // preserve favorite order (most recent first)
      const byId = new Map(recipes.map((r) => [r._id.toString(), r]));
      const items = ids
        .map((id) => byId.get(id.toString()))
        .filter((r): r is NonNullable<typeof r> => r !== undefined)
        .map((r) => toRecipe(r, { isFavorite: true }));
      return { items };
    },
  );

  // --- list my favorited books (membership-aware) ---
  app.get(
    '/favorites/books',
    { onRequest: [app.authenticate], schema: { tags: ['favorites'] } },
    async (req) => {
      const userId = new ObjectId(req.user.id);
      const favs = await app.collections.favorites
        .find({ userId, kind: 'book' }, { sort: { createdAt: -1 } })
        .toArray();
      const ids = favs.map((f) => f.targetId);
      if (ids.length === 0) return { items: [] };
      const books = await app.collections.recipeBooks
        .find({
          _id: { $in: ids },
          $or: [{ ownerId: userId }, { 'members.userId': userId }],
        })
        .toArray();
      const byId = new Map(books.map((b) => [b._id.toString(), b]));
      const items = ids
        .map((id) => byId.get(id.toString()))
        .filter((b): b is NonNullable<typeof b> => b !== undefined)
        .map((b) => toRecipeBook(b, { isFavorite: true }));
      return { items };
    },
  );
};
