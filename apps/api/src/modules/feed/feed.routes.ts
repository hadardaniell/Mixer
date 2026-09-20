// apps/api/src/modules/feed/feed.routes.ts
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ObjectId } from 'mongodb';
import type { HomeFeedResponse } from '@mixer/contracts';

import type { RecipeBookDoc } from '../../db/types.js';
import { toRecipeBook } from '../recipe-books/recipe-books.mapper.js';
import {
  RECIPE_SUMMARY_PROJECTION,
  toRecipeSummary,
  type RecipeSummaryDoc,
} from '../recipes/recipes.mapper.js';
import { toPublicUser } from '../users/users.mapper.js';
import { favoritedIds } from '../favorites/favorites.service.js';
import { readFeedCache, writeFeedCache } from './feed.cache.js';

/** Cover grids show four thumbnails, so four ids per book is all the client can draw. */
const MAX_COVER_IMAGES = 4;
/**
 * The "shared with me" row is a preview behind a "see more", not an archive.
 * Hydrating every recipe of every shared book to render ten of them was the
 * single biggest cost on the feed, so only the newest slice of each book counts.
 */
const MAX_SHARED_PER_BOOK = 12;
/** Matches the limit the client used to pass to `GET /shares/received`. */
const MAX_DIRECT_SHARES = 50;

export const feedRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/feed/home',
    { onRequest: [app.authenticate], schema: { tags: ['feed'] } },
    async (req) => {
      const cached = readFeedCache<HomeFeedResponse>(req.user.id);
      if (cached) return cached;

      const userId = new ObjectId(req.user.id);

      // Round trip 1. Three independent lookups, so the slowest sets the latency
      // rather than their sum.
      const [bookDocs, directShares, favDocs] = await Promise.all([
        app.collections.recipeBooks
          .find({
            $or: [
              { ownerId: userId },
              { members: { $elemMatch: { userId, status: { $ne: 'pending' } } } },
            ],
            // The auto-created "my recipes" book is plumbing, not something the
            // user browses — same exclusion `GET /recipe-books` makes.
            system: { $ne: true },
          })
          .sort({ createdAt: -1 })
          .toArray(),
        // Only the ids are wanted here. The general `/shares/received` route also
        // resolves each share's display name, one query per share — a cost the
        // feed paid and then threw away.
        app.collections.sharedItems
          .find(
            { friendId: userId, resourceType: 'recipe', status: 'accepted' },
            { sort: { createdAt: -1 }, limit: MAX_DIRECT_SHARES },
          )
          .project<{ resourceId: ObjectId }>({ resourceId: 1 })
          .toArray(),
        app.collections.favorites
          .find({ userId, kind: 'recipe' }, { sort: { createdAt: -1 } })
          .project<{ targetId: ObjectId }>({ targetId: 1 })
          .toArray(),
      ]);

      const coverIds = new Set<string>();
      const sharedIds = new Set<string>();
      const memberIds = new Set<string>();

      for (const b of bookDocs) {
        for (const id of b.recipeIds.slice(0, MAX_COVER_IMAGES)) coverIds.add(id.toString());
        // Recipes from books I don't own, and from my own books that others are
        // in — a friend may have added recipes there too.
        if (!b.ownerId.equals(userId) || hasOtherMembers(b, userId)) {
          for (const id of b.recipeIds.slice(0, MAX_SHARED_PER_BOOK)) sharedIds.add(id.toString());
        }
        for (const m of b.members) memberIds.add(m.userId.toString());
      }

      const directSharedIds = directShares.map((s) => s.resourceId.toString());
      const favIds = favDocs.map((f) => f.targetId);

      // Every id below is already reachable by this user — through a book they
      // belong to, or an accepted share — so no per-recipe permission pass is
      // needed on top.
      const recipeIds = [...new Set([...coverIds, ...sharedIds, ...directSharedIds])].map(
        (id) => new ObjectId(id),
      );

      // Round trip 2. These are what the client could not even ask for until the
      // books response came back; here they are just the next statement.
      const [recipeDocs, memberDocs, favRecipeDocs] = await Promise.all([
        recipeIds.length
          ? app.collections.recipes
              .find({ _id: { $in: recipeIds } }, { projection: RECIPE_SUMMARY_PROJECTION })
              .toArray()
          : [],
        memberIds.size
          ? app.collections.users
              .find({ _id: { $in: [...memberIds].map((id) => new ObjectId(id)) } })
              .toArray()
          : [],
        favIds.length
          ? app.collections.recipes
              .find(
                {
                  _id: { $in: favIds },
                  $or: [{ ownerId: userId }, { visibility: { $ne: 'private' } }],
                },
                { projection: RECIPE_SUMMARY_PROJECTION },
              )
              .toArray()
          : [],
      ]);

      const [favSet, bookFavSet] = await Promise.all([
        favoritedIds(app.collections, req.user.id, 'recipe', recipeDocs.map((r) => r._id)),
        favoritedIds(app.collections, req.user.id, 'book', bookDocs.map((b) => b._id)),
      ]);

      const summarize = (doc: RecipeSummaryDoc) =>
        toRecipeSummary(doc, { isFavorite: favSet.has(doc._id.toString()) });

      const coverRecipes = recipeDocs
        .filter((r) => coverIds.has(r._id.toString()))
        .map(summarize);

      // Both routes to "someone shared this with me" — a book I'm a member of and
      // a direct share — collapsed into one row, deduped by id because the same
      // recipe can arrive both ways. My own recipes are not shares to me.
      const wanted = new Set([...sharedIds, ...directSharedIds]);
      const sharedWithMe = recipeDocs
        .filter((r) => wanted.has(r._id.toString()) && !r.ownerId.equals(userId))
        .map(summarize);

      // Favourites keep the order they were favourited in, which is the order the
      // ids came back in — the recipe fetch does not preserve it.
      const favById = new Map(favRecipeDocs.map((r) => [r._id.toString(), r]));
      const favorites = favIds
        .map((id) => favById.get(id.toString()))
        .filter((r): r is NonNullable<typeof r> => !!r)
        .map((r) => toRecipeSummary(r, { isFavorite: true }));

      const payload: HomeFeedResponse = {
        books: bookDocs.map((b) =>
          toRecipeBook(b, { isFavorite: bookFavSet.has(b._id.toString()) }),
        ),
        coverRecipes,
        members: memberDocs.map(toPublicUser),
        favorites,
        sharedWithMe,
      };

      writeFeedCache(req.user.id, payload);
      return payload;
    },
  );
};

function hasOtherMembers(book: RecipeBookDoc, userId: ObjectId): boolean {
  return book.members.some((m) => !m.userId.equals(userId));
}
