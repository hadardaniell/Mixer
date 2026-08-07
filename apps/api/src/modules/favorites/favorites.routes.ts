// apps/api/src/modules/favorites/favorites.routes.ts
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { FavoriteKindSchema, type FavoriteKind } from '@mixer/contracts';
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

  // --- list my favorites, branched by ?kind=recipe|book ---
  app.get(
    '/favorites',
    {
      onRequest: [app.authenticate],
      schema: {
        querystring: z.object({ kind: FavoriteKindSchema }),
        tags: ['favorites'],
      },
    },
    async (req) => {
      const userId = new ObjectId(req.user.id);
      const { kind } = req.query;
      const favs = await app.collections.favorites
        .find({ userId, kind }, { sort: { createdAt: -1 } })
        .toArray();
      const ids = favs.map((f) => f.targetId);
      if (ids.length === 0) return { items: [] };

      // מציאת שפת היעד של המשתמש (בברירת מחדל 'he')
      let targetLang: 'he' | 'en' = 'en';
      const userDoc = await app.collections.users.findOne({ _id: userId });
      if (userDoc?.locale) {
        targetLang = userDoc.locale as 'he' | 'en';
      }

      if (kind === 'recipe') {
        const recipes = await app.collections.recipes
          .find({
            _id: { $in: ids },
            $or: [{ ownerId: userId }, { visibility: { $ne: 'private' } }],
          })
          .toArray();

        // שליפת התרגומים עבור המתכונים שנמצאו
        const recipeIds = recipes.map((r) => r._id);
        const translations = await app.collections.recipeTranslations
          ?.find({
            recipeId: { $in: recipeIds },
            language: targetLang,
          })
          .toArray() ?? [];

        const translationMap = new Map(translations.map((t) => [t.recipeId.toString(), t]));

        // החלפת הנתונים במידה וקיים תרגום שמור
        const translatedRecipes = recipes.map((doc) => {
          if (doc.language && doc.language !== targetLang) {
            const cached = translationMap.get(doc._id.toString());
            if (cached) {
              return {
                ...doc,
                title: cached.title,
                description: cached.description,
                tags: cached.tags ?? doc.tags,
                cuisine: cached.cuisine ?? doc.cuisine,
                language: targetLang,
              };
            }
          }
          return doc;
        });

        const byId = new Map(translatedRecipes.map((r) => [r._id.toString(), r]));
        const items = ids
          .map((id) => byId.get(id.toString()))
          .filter((r): r is NonNullable<typeof r> => r !== undefined)
          .map((r) => toRecipe(r, { isFavorite: true }));
        return { items };
      }

      // book
     const books = await app.collections.recipeBooks
        .find({
          _id: { $in: ids },
          $or: [{ ownerId: userId }, { 'members.userId': userId }],
        })
        .toArray();

      // שליפת התרגומים עבור ספרי המתכונים (בשימוש ב-bookTranslations ו-name)
      const bookIds = books.map((b) => b._id);
      const bookTranslations = await app.collections.bookTranslations
        ?.find({
          bookId: { $in: bookIds },
          language: targetLang,
        })
        .toArray() ?? [];

      const bookTranslationMap = new Map(bookTranslations.map((t) => [t.bookId.toString(), t]));

      const translatedBooks = books.map((doc) => {
        if (doc.language && doc.language !== targetLang) {
          const cached = bookTranslationMap.get(doc._id.toString());
          if (cached) {
            return {
              ...doc,
              name: cached.name, // שימוש ב-name במקום title
              description: cached.description ?? doc.description,
              language: targetLang,
            };
          }
        }
        return doc;
      });

      const byId = new Map(translatedBooks.map((b) => [b._id.toString(), b]));
      const items = ids
        .map((id) => byId.get(id.toString()))
        .filter((b): b is NonNullable<typeof b> => b !== undefined)
        .map((b) => toRecipeBook(b, { isFavorite: true }));
      return { items };
    },
  );
};
