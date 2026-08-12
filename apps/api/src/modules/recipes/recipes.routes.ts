// apps/api/src/modules/recipes/recipes.routes.ts
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ObjectId, type Filter } from 'mongodb';
import { z } from 'zod';
import {
  CreateRecipeInputSchema,
  ExtractFromTextInputSchema,
  ExtractFromImageInputSchema,
  ExtractFromTextResultSchema,
  RecipeListQuerySchema,
  UpdateRecipeInputSchema,
} from '@mixer/contracts';
import { config } from '../../config.js';
import type { RecipeDoc } from '../../db/types.js';
import type { Collections } from '../../plugins/mongo.js';
import { toRecipe } from './recipes.mapper.js';
import { favoritedIds } from '../favorites/favorites.service.js';
import { notificationService } from '../../services/notification.service.js';
import { generateAndStoreCoverImage, getSuggestedCoverImageUrl } from './recipes.service.js';
import { cosineSimilarity, escapeRegex, applySearchFilter } from './search.utils.js';
import { canRead, tagMatchesCategory } from './recipes.utils.js';

const IdParam = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/i) });

async function generateAndStoreEmbedding(
  collections: { recipes: import('mongodb').Collection<RecipeDoc> },
  recipeId: import('mongodb').ObjectId,
  recipe: { title: string; description?: string; ingredients?: Array<{ name: string }>; tags?: string[]; cuisine?: string },
): Promise<void> {
  try {
    const response = await fetch(`${config.aiBaseUrl}/embed/recipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        tags: recipe.tags,
        cuisine: recipe.cuisine,
      }),
    });
    if (!response.ok) return;
    const data = await response.json() as { embedding: number[] };
    await collections.recipes.updateOne(
      { _id: recipeId },
      { $set: { embedding: data.embedding, embeddingIndexedAt: new Date() } },
    );
  } catch {
    // silently fail — embedding is optional, recipe save must succeed
  }
}

/**
 * Being shared a recipe grants read access to it. Shares are created with the recipe
 * left private, so without this the recipient can see the share in their inbox and gets
 * 403 on the recipe itself — they could only ever fork it, never look first.
 *
 * Read-only: ownership checks on edit and delete stay untouched.
 */
async function canReadViaShare(
  collections: Collections,
  req: { user?: { id: string } },
  doc: RecipeDoc,
): Promise<boolean> {
  if (!req.user) return false;
  const share = await collections.sharedItems.findOne({
    resourceType: 'recipe',
    resourceId: doc._id,
    friendId: new ObjectId(req.user.id),
    status: { $in: ['pending', 'accepted'] },
  });
  return share !== null;
}

// Returns true when the recipe lives in a book the requesting user is a member
// of (any role: viewer, editor, or owner). This lets book members read all
// recipes in a shared book even if those recipes are private.
async function canReadViaBook(
  collections: Collections,
  req: { user?: { id: string } },
  doc: RecipeDoc,
): Promise<boolean> {
  if (!req.user) return false;
  const userId = new ObjectId(req.user.id);
  const book = await collections.recipeBooks.findOne({
    recipeIds: doc._id,
    $or: [{ ownerId: userId }, { 'members.userId': userId }],
  });
  return book !== null;
}

/**
 * Best-effort mapping of a recipe's free-text tags onto the curated `categories`
 * collection, so browse-by-category (which filters on `categoryIds`) has data to
 * match. A tag matches a category when it equals — or loosely contains / is
 * contained by — the category's slug or its Hebrew/English label (so קינוח
 * matches קינוחים, and "pasta" matches the Pasta category). Best-effort: an
 * unmatched tag just contributes nothing.
 */
async function deriveCategoryIds(
  categories: import('mongodb').Collection<import('../../db/types.js').CategoryDoc>,
  tags: string[],
): Promise<ObjectId[]> {
  const cleaned = tags.map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (cleaned.length === 0) return [];
  const cats = await categories.find({ isActive: true }).toArray();
  const ids: ObjectId[] = [];
  for (const c of cats) {
    const keys = [c.slug, c.label.he, c.label.en].map((k) => k.trim().toLowerCase());
    const hit = cleaned.some((tag) => tagMatchesCategory(tag, keys));
    if (hit) ids.push(c._id);
  }
  return ids;
}

export const recipesRoutes: FastifyPluginAsyncZod = async (app) => {
    app.post(
      '/recipes/upload-image',
      {
        onRequest: [app.authenticate], 
      },
      async (req, reply) => {
        const data = await req.file({ limits: { fileSize: 5 * 1024 * 1024 } }); 
        
        if (!data) {
          return reply.code(400).send({ error: 'No image file sent' });
        }

        const uniqueFileName = `recipes/${Date.now()}_${data.filename}`;
        
        const file = app.firebaseBucket.file(uniqueFileName);

        const writeStream = file.createWriteStream({
          metadata: {
            contentType: data.mimetype, // (png/jpeg)
          },
          resumable: false, 
        });

        try {
          await new Promise<void>((resolve, reject) => {
            data.file.pipe(writeStream)
              .on('finish', resolve)
              .on('error', (err: any) => {
                app.log.error('Write Stream Error:', err);
                reject(err);
              });
            
            data.file.on('error', (err: any) => {
              app.log.error('File Read Error:', err);
              reject(err);
            });
          });

          const encodedFilePath = encodeURIComponent(uniqueFileName);
          const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${app.firebaseBucket.name}/o/${encodedFilePath}?alt=media`;

          return reply.code(200).send({ imageUrl: publicUrl });

        } catch (error: any) {
          app.log.error('Upload Error Details:', error);

          return reply.code(500).send({ 
            error: 'Failed to upload profile picture to Firebase storage server',
            message: error?.message || error
          });
        }
      }
    );

  app.post(
    '/recipes',
    {
      onRequest: [app.authenticate],
      schema: { body: CreateRecipeInputSchema, tags: ['recipes'] },
    },
    async (req, reply) => {
      const now = new Date();
      const body = req.body;
      // Explicit categoryIds win; otherwise derive them from the recipe's tags
      // so browse-by-category works without the client having to know category ids.
      const categoryIds = body.categoryIds.length
        ? body.categoryIds.map((id) => new ObjectId(id))
        : await deriveCategoryIds(app.collections.categories, body.tags);
      const doc: RecipeDoc = {
        _id: new ObjectId(),
        ownerId: new ObjectId(req.user.id),
        title: body.title,
        description: body.description,
        coverImageUrl: body.coverImageUrl,
        ingredients: body.ingredients,
        steps: body.steps,
        servings: body.servings,
        prepTimeMinutes: body.prepTimeMinutes,
        cookTimeMinutes: body.cookTimeMinutes,
        difficulty: body.difficulty,
        cuisine: body.cuisine,
        tags: body.tags,
        categoryIds,
        language: body.language,
        source: {
          type: body.source.type,
          url: body.source.url,
          platform: body.source.platform,
          importTaskId: body.source.importTaskId
            ? new ObjectId(body.source.importTaskId)
            : undefined,
        },
        visibility: body.visibility,
        status: body.status,
        createdAt: now,
        updatedAt: now,
      };
      await app.collections.recipes.insertOne(doc);
        const personalBook =
          await app.collections.recipeBooks.findOne({
            ownerId: doc.ownerId,
            type: 'personal',
          });

        if (personalBook) {
          await app.collections.recipeBooks.updateOne(
            {
              _id: personalBook._id,
            },
            {
              $addToSet: {
                recipeIds: doc._id,
              },
              $set: {
                updatedAt: new Date(),
              },
            },
          );
        }
      if (!doc.coverImageUrl) {
        generateAndStoreCoverImage(app.collections.recipes, app.firebaseBucket, doc._id, doc);
      }  
      generateAndStoreEmbedding(app.collections, doc._id, doc);
      return reply.code(201).send(toRecipe(doc));
    },
  );

  app.post(
    '/recipes/:id/save-as',
    {
      onRequest: [app.authenticate],
      schema: { 
        params: IdParam, 
        tags: ['recipes'],
        summary: 'Save As (Duplicate Recipe)',
        description: 'Creates a private copy of an existing recipe and automatically adds it to your personal recipe book.',
      },
    },
    async (req, reply) => {
      try {
        const original = await app.collections.recipes.findOne({ _id: new ObjectId(req.params.id) });
        if (!original) return reply.code(404).send({ error: 'recipe not found' });
        if (
          !canRead(req, original) &&
          !(await canReadViaShare(app.collections, req, original)) &&
          !(await canReadViaBook(app.collections, req, original))
        ) {
          return reply.code(403).send({ error: 'forbidden' });
        }

        const now = new Date();
        const doc: RecipeDoc = {
          ...original,
          _id: new ObjectId(),
          ownerId: new ObjectId(req.user.id),
          forkedFrom: original._id,
          forkedAt: now,
          visibility: 'private',
          createdAt: now,
          updatedAt: now,
        };

        await app.collections.recipes.insertOne(doc);

        const personalBook = await app.collections.recipeBooks.findOne({
          ownerId: doc.ownerId,
          type: 'personal',
        });

        if (personalBook) {
          await app.collections.recipeBooks.updateOne(
            { _id: personalBook._id },
            {
              $addToSet: { recipeIds: doc._id },
              $set: { updatedAt: now },
            },
          );
        }

        generateAndStoreEmbedding(app.collections, doc._id, doc);
        return reply.code(201).send(toRecipe(doc));
      } catch (error) {
        app.log.error(error, 'Error during recipe save-as (forking) process');
        return reply.code(500).send({ error: 'Failed to duplicate recipe due to an internal error' });
      }
    },
  );

  app.get(
    '/recipes',
    {
      onRequest: [app.optionalAuthenticate],
      schema: { querystring: RecipeListQuerySchema, tags: ['recipes'] },
    },
    async (req) => {
      const { owner, tag, categoryId, q, visibility, status, limit, skip } = req.query;
      const filter: Filter<RecipeDoc> = {};

      const isOwnerSelf = owner === 'me' && !!req.user?.id;
      if (isOwnerSelf) {
        filter.ownerId = new ObjectId(req.user!.id);
      } else if (owner && owner !== 'me' && ObjectId.isValid(owner)) {
        filter.ownerId = new ObjectId(owner);
        if (req.user?.id !== owner) filter.visibility = { $ne: 'private' };
      } else if (!req.user) {
        filter.visibility = { $ne: 'private' };
      } else {
        const userId = new ObjectId(req.user.id);
        const memberBooks = await app.collections.recipeBooks
          .find({ $or: [{ ownerId: userId }, { 'members.userId': userId }] })
          .project({ recipeIds: 1 })
          .toArray();
        const bookRecipeIds = memberBooks.flatMap((b) => (b as { recipeIds?: ObjectId[] }).recipeIds ?? []);
        filter.$or = [
          { ownerId: userId },
          { visibility: { $ne: 'private' } },
          ...(bookRecipeIds.length ? [{ _id: { $in: bookRecipeIds } }] : []),
        ];
      }

      // Drafts are private work-in-progress. They surface only when explicitly
      // requested (e.g. the drafts screen: owner=me&status=draft); every other
      // listing hides them — including the owner's own recipes (my-recipes,
      // profile, feed), which is why we must exclude drafts even when
      // isOwnerSelf. `$ne: 'draft'` also covers legacy docs with no status
      // field, so nothing disappears before the backfill runs.
      if (status === 'draft') {
        filter.status = 'draft';
      } else {
        filter.status = { $ne: 'draft' };
      }

      if (visibility) filter.visibility = visibility;
      if (tag) filter.tags = tag;
      if (categoryId && ObjectId.isValid(categoryId)) {
        filter.categoryIds = new ObjectId(categoryId);
      }
      if (q) {
        Object.assign(filter, applySearchFilter(filter as Record<string, unknown>, q));
      }

      const cursor = app.collections.recipes.find(filter, {
        sort: { createdAt: -1 },
        limit,
        skip,
      });
      const [items, total] = await Promise.all([
        cursor.toArray(),
        app.collections.recipes.countDocuments(filter),
      ]);

      const favSet = req.user
        ? await favoritedIds(app.collections, req.user.id, 'recipe', items.map((r) => r._id))
        : null;
      return {
        items: items.map((r) =>
        favSet ? toRecipe(r, { isFavorite: favSet.has(r._id.toString()) }) : toRecipe(r),
      ),
      total,
      };
    },
  );

  app.get(
  '/recipes/:id',
  {
    onRequest: [app.optionalAuthenticate],
    schema: { params: IdParam, tags: ['recipes'] },
  },
  async (req, reply) => {
    const doc = await app.collections.recipes.findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return reply.code(404).send({ error: 'recipe not found' });
    if (
      !canRead(req, doc) &&
      !(await canReadViaShare(app.collections, req, doc)) &&
      !(await canReadViaBook(app.collections, req, doc))
    ) {
      return reply.code(403).send({ error: 'forbidden' });
    }

     if (!req.user) {
      return toRecipe(doc);
    }

    const favSet = await favoritedIds(app.collections, req.user.id, 'recipe', [doc._id]);
    return toRecipe(doc, { isFavorite: favSet.has(doc._id.toString()) });
  },
);

app.post(
  '/recipes/:id/translate',
  {
    onRequest: [app.authenticate],
    schema: {
      params: IdParam,
      tags: ['recipes'],
    },
  },
  async (req, reply) => {
    const recipeId = new ObjectId(req.params.id);

    const recipe = await app.collections.recipes.findOne({
      _id: recipeId,
    });

    if (!recipe) {
      return reply.code(404).send({
        error: 'recipe not found',
      });
    }

    if (
      !canRead(req, recipe) &&
      !(await canReadViaShare(app.collections, req, recipe))
    ) {
      return reply.code(403).send({
        error: 'forbidden',
      });
    }

    const user = await app.collections.users.findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { locale: 1 } },
    );

    const targetLanguage: 'he' | 'en' = user?.locale ?? 'en';

    // If the recipe is already in the user's language,
    // there is nothing to translate.
    if (recipe.language === targetLanguage) {
      return reply.code(200).send(toRecipe(recipe));
    }

    // Check translation cache first.
    const cachedTranslation =
      await app.collections.recipeTranslations?.findOne({
        recipeId,
        language: targetLanguage,
      });

    if (cachedTranslation) {
      return reply.code(200).send({
        ...toRecipe(recipe),
        title: cachedTranslation.title,
        description: cachedTranslation.description,
        tags: cachedTranslation.tags ?? recipe.tags,
        cuisine: cachedTranslation.cuisine ?? recipe.cuisine,
        ingredients: cachedTranslation.ingredients,
        steps: cachedTranslation.steps,
        language: targetLanguage,
      });
    }

    try {
      // No cached translation - call the AI service.
      const response = await fetch(
        `${config.aiBaseUrl}/translate/recipe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipe: {
              title: recipe.title,
              description: recipe.description,
              tags: recipe.tags,
              cuisine: recipe.cuisine,
              ingredients: recipe.ingredients,
              steps: recipe.steps,
            },
            targetLanguage,
          }),
        },
      );

      if (!response.ok) {
        return reply.code(500).send({
          error: 'Failed to translate recipe',
        });
      }

      const translatedData = (await response.json()) as {
        title: string;
        description?: string;
        tags?: string[];
        cuisine?: string;
        ingredients: RecipeDoc['ingredients'];
        steps: RecipeDoc['steps'];
      };

      // Save translation in cache.
      await app.collections.recipeTranslations?.insertOne({
        _id: new ObjectId(),
        recipeId,
        language: targetLanguage,
        title: translatedData.title,
        description: translatedData.description,
        tags: translatedData.tags ?? recipe.tags,
        cuisine: translatedData.cuisine ?? recipe.cuisine,
        ingredients: translatedData.ingredients,
        steps: translatedData.steps,
        createdAt: new Date(),
      });

      // Return translated recipe.
      return reply.code(200).send({
        ...toRecipe(recipe),
        ...translatedData,
        language: targetLanguage,
      });
    } catch (error) {
      app.log.error(
        error,
        '[recipes/:id/translate] Translation failed',
      );

      return reply.code(500).send({
        error: 'Failed to translate recipe',
      });
    }
  },
);

  app.patch(
    '/recipes/:id',
    {
      onRequest: [app.authenticate],
      schema: { params: IdParam, body: UpdateRecipeInputSchema, tags: ['recipes'] },
    },
    async (req, reply) => {
      const _id = new ObjectId(req.params.id);
      const existing = await app.collections.recipes.findOne({ _id });
      if (!existing) return reply.code(404).send({ error: 'recipe not found' });
      if (existing.ownerId.toString() !== req.user.id) {
        return reply.code(403).send({ error: 'not the owner' });
      }
      const { source, categoryIds, ...rest } = req.body;
      const $set: Partial<RecipeDoc> & { updatedAt: Date } = { ...rest, updatedAt: new Date() };
      if (categoryIds) {
        $set.categoryIds = categoryIds.map((id) => new ObjectId(id));
      } else if (rest.tags) {
        // Tags changed (e.g. the wizard saving step 2) — re-derive the category
        // mapping so it stays in sync with the recipe's tags.
        $set.categoryIds = await deriveCategoryIds(app.collections.categories, rest.tags);
      }
      if (source) {
        $set.source = {
          type: source.type,
          url: source.url,
          platform: source.platform,
          importTaskId: source.importTaskId ? new ObjectId(source.importTaskId) : undefined,
        };
      }
      const updated = await app.collections.recipes.findOneAndUpdate(
        { _id },
        { $set },
        { returnDocument: 'after' },
      );
      await app.collections.recipeTranslations
        .deleteMany({ recipeId: _id })
        .catch((err) => app.log.error(err, 'Failed to clear translation cache on recipe update'));
      generateAndStoreEmbedding(app.collections, _id, updated!);
      return toRecipe(updated!);
    },
  );

  app.delete(
    '/recipes/:id',
    {
      onRequest: [app.authenticate],
      schema: { params: IdParam, tags: ['recipes'] },
    },
    async (req, reply) => {
      const _id = new ObjectId(req.params.id);
      const existing = await app.collections.recipes.findOne({ _id });
      if (!existing) return reply.code(404).send({ error: 'recipe not found' });
      if (existing.ownerId.toString() !== req.user.id) {
        return reply.code(403).send({ error: 'not the owner' });
      }

      // Auto-fork for friends who have a live link (accepted share, not yet saved)
      const [liveShares, owner] = await Promise.all([
        app.collections.sharedItems
          .find({ resourceId: _id, resourceType: 'recipe', status: 'accepted', savedAt: null })
          .toArray(),
        app.collections.users.findOne(
          { _id: new ObjectId(req.user.id) },
          { projection: { displayName: 1 } },
        ),
      ]);

      await Promise.all(
        liveShares.map(async (share) => {
          const now = new Date();
          const fork: RecipeDoc = {
            ...existing,
            _id: new ObjectId(),
            ownerId: share.friendId,
            visibility: 'private',
            forkedFrom: existing._id,
            forkedAt: now,
            createdAt: now,
            updatedAt: now,
          };
          await app.collections.recipes.insertOne(fork);
          await app.collections.sharedItems.updateOne(
            { _id: share._id },
            { $set: { savedAt: now, savedResourceId: fork._id } },
          );
          await notificationService.send(share.friendId.toString(), 'OWNER_DELETED_RESOURCE', {
            fromUserId: req.user.id,
            fromUserName: owner?.displayName ?? '',
            resourceType: 'recipe',
            resourceName: existing.title,
            savedCopyId: fork._id.toString(),
          });
        }),
      );

      await app.collections.sharedItems.deleteMany({ resourceId: _id, resourceType: 'recipe' });
      await app.collections.recipes.deleteOne({ _id });
      await app.collections.recipeTranslations
        .deleteMany({ recipeId: _id })
        .catch((err) => app.log.error(err, 'Failed to clear translation cache on recipe delete'));
      return reply.code(204).send();
    },
  );

  app.post(
    '/recipes/:id/fork',
    {
      onRequest: [app.authenticate],
      schema: { params: IdParam, tags: ['recipes'] },
    },
    async (req, reply) => {
      const source = await app.collections.recipes.findOne({ _id: new ObjectId(req.params.id) });
      if (!source) return reply.code(404).send({ error: 'recipe not found' });
      if (!canRead(req, source)) return reply.code(403).send({ error: 'forbidden' });

      const now = new Date();
      const fork: RecipeDoc = {
        ...source,
        _id: new ObjectId(),
        ownerId: new ObjectId(req.user.id),
        visibility: 'private',
        status: 'published',
        forkedFrom: source._id,
        forkedAt: now,
        createdAt: now,
        updatedAt: now,
      };
      await app.collections.recipes.insertOne(fork);
      return reply.code(201).send(toRecipe(fork));
    },
  );

  app.post(
    '/recipes/import/url',
    {
      onRequest: [app.authenticate],
      schema: {
        body: z.object({ url: z.string().url(), locale: z.string().optional() }),
        response: {
          200: ExtractFromTextResultSchema,
          422: z.object({ error: z.string() }),
          500: z.object({ error: z.string() }),
        },
        tags: ['recipes'],
      },
    },
    async (req, reply) => {
      const { url } = req.body;
      let effectiveLocale = req.body.locale;
      if (!effectiveLocale) {
        const user = await app.collections.users.findOne(
          { _id: new ObjectId(req.user.id) },
          { projection: { locale: 1 } },
        );
        effectiveLocale = user?.locale ?? 'he';
      }

      // Check global cache first — if any user already extracted this URL, reuse it
      const cached = await app.collections.urlExtractionCache.findOne({ url, locale: effectiveLocale });
      if (cached) {
        app.log.info(`[import/url] Cache hit for ${url} (locale: ${effectiveLocale})`);
        const result = cached.extraction as Record<string, unknown>;
        if (!result.coverImageUrl && typeof result.title === 'string' && result.title) {
          const coverImageUrl = await getSuggestedCoverImageUrl({
            title: result.title,
            description: typeof result.description === 'string' ? result.description : undefined,
            cuisine: typeof result.cuisine === 'string' ? result.cuisine : undefined,
            ingredients: Array.isArray(result.ingredients)
              ? (result.ingredients as Array<{ name: string }>)
              : undefined,
          });
          if (coverImageUrl) {
            result.coverImageUrl = coverImageUrl;
            await app.collections.urlExtractionCache
              .updateOne({ _id: cached._id }, { $set: { 'extraction.coverImageUrl': coverImageUrl } })
              .catch(() => {});
          }
        }
        return ExtractFromTextResultSchema.parse(result);
      }

      // Cache miss — call the AI service. `/extract/url` branches internally:
      // web pages are scraped (Jina) and video links (YouTube/TikTok/Instagram/…)
      // are transcribed, so this single endpoint covers every source the mobile
      // "create from link" screen advertises (web + video + social).
      app.log.info(`[import/url] Cache miss — calling AI for ${url} (locale: ${effectiveLocale})`);
      const response = await fetch(`${config.aiBaseUrl}/extract/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, locale: effectiveLocale }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        return reply.code(response.status === 422 ? 422 : 500).send({
          error: data?.error ?? 'AI service failed to extract recipe from URL',
        });
      }

      const extraction = (await response.json()) as Record<string, unknown>;

      if (!extraction.coverImageUrl && typeof extraction.title === 'string' && extraction.title) {
        const coverImageUrl = await getSuggestedCoverImageUrl({
          title: extraction.title,
          description: typeof extraction.description === 'string' ? extraction.description : undefined,
          cuisine: typeof extraction.cuisine === 'string' ? extraction.cuisine : undefined,
          ingredients: Array.isArray(extraction.ingredients)
            ? (extraction.ingredients as Array<{ name: string }>)
            : undefined,
        });
        if (coverImageUrl) {
          extraction.coverImageUrl = coverImageUrl;
        }
      }

      // Save to cache so future requests skip the AI call
      await app.collections.urlExtractionCache
        .insertOne({ _id: new ObjectId(), url, locale: effectiveLocale, extraction, extractedAt: new Date() })
        .catch(() => {}); // ignore duplicate-key race (two simultaneous requests for same URL)

      return ExtractFromTextResultSchema.parse(extraction);
    },
  );

  app.post(
    '/recipes/import/text',
    {
      onRequest: [app.authenticate],
      schema: {
        body: ExtractFromTextInputSchema,
        response: { 200: ExtractFromTextResultSchema },
        tags: ['recipes'],
      },
    },
    async (req) => {
      const response = await fetch(`${config.aiBaseUrl}/extract/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: req.body.text, locale: req.body.locale }),
      });

      if (!response.ok) {
        throw new Error('AI service failed to extract recipe');
      }

      const data = (await response.json()) as Record<string, unknown>;
      if (!data.coverImageUrl && typeof data.title === 'string' && data.title) {
        const coverImageUrl = await getSuggestedCoverImageUrl({
          title: data.title,
          description: typeof data.description === 'string' ? data.description : undefined,
          cuisine: typeof data.cuisine === 'string' ? data.cuisine : undefined,
          ingredients: Array.isArray(data.ingredients)
            ? (data.ingredients as Array<{ name: string }>)
            : undefined,
        });
        if (coverImageUrl) {
          data.coverImageUrl = coverImageUrl;
        }
      }

      const result = ExtractFromTextResultSchema.parse(data);
      return result;
    },
  );

  app.post(
    '/recipes/import/image',
    {
      bodyLimit: 10 * 1024 * 1024,
      onRequest: [app.authenticate],
      schema: {
        body: ExtractFromImageInputSchema,
        response: {
          200: ExtractFromTextResultSchema,
          422: z.object({ error: z.string(), message: z.string().optional() }),
          500: z.object({ error: z.string(), message: z.string().optional() }),
        },
        tags: ['recipes'],
      },
    },
    async (req, reply) => {
      const response = await fetch(`${config.aiBaseUrl}/extract/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: req.body.images, locale: req.body.locale }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
        const errorMsg = data?.error ?? data?.message ?? 'AI service failed to extract recipe from image';
        if (errorMsg === 'The images do not all belong to the same recipe.' || data?.message === 'images_not_same_recipe') {
          return reply.code(422).send({ message: 'images_not_same_recipe', error: errorMsg });
        }
        return reply.code(response.status === 422 ? 422 : 500).send({
          error: errorMsg,
          message: errorMsg,
        });
      }

      const data = (await response.json()) as Record<string, unknown>;
      if (!data.coverImageUrl && typeof data.title === 'string' && data.title) {
        const coverImageUrl = await getSuggestedCoverImageUrl({
          title: data.title,
          description: typeof data.description === 'string' ? data.description : undefined,
          cuisine: typeof data.cuisine === 'string' ? data.cuisine : undefined,
          ingredients: Array.isArray(data.ingredients)
            ? (data.ingredients as Array<{ name: string }>)
            : undefined,
        });
        if (coverImageUrl) {
          data.coverImageUrl = coverImageUrl;
        }
      }

      const result = ExtractFromTextResultSchema.parse(data);
      return result;
    },
  );

  app.get(
    '/recipes/semantic-search',
    {
      onRequest: [app.optionalAuthenticate],
      schema: {
        querystring: z.object({ q: z.string().min(1) }),
        tags: ['recipes'],
      },
    },
    async (req, reply) => {
      const { q } = req.query;

      const embedResponse = await fetch(`${config.aiBaseUrl}/embed/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (!embedResponse.ok) {
        return reply.code(503).send({ error: 'embedding service unavailable' });
      }

      const { embedding: queryEmbedding } = await embedResponse.json() as { embedding: number[] };

      let visibilityFilter: Filter<RecipeDoc>;
      if (req.user) {
        const userId = new ObjectId(req.user.id);
        const memberBooks = await app.collections.recipeBooks
          .find({ $or: [{ ownerId: userId }, { 'members.userId': userId }] })
          .project({ recipeIds: 1 })
          .toArray();
        const bookRecipeIds = memberBooks.flatMap((b) => (b as { recipeIds?: ObjectId[] }).recipeIds ?? []);
        visibilityFilter = {
          $or: [
            { ownerId: userId },
            { visibility: { $in: ['public', 'unlisted'] } },
            ...(bookRecipeIds.length ? [{ _id: { $in: bookRecipeIds } }] : []),
          ],
        };
      } else {
        visibilityFilter = { visibility: { $in: ['public', 'unlisted'] } };
      }

      const recipes = await app.collections.recipes
        // Exclude drafts — search should only surface published recipes, even
        // the caller's own (which the visibility filter would otherwise include).
        .find({ ...visibilityFilter, status: { $ne: 'draft' }, embedding: { $exists: true } })
        .toArray();

      const scored = recipes
        .map((r) => ({ recipe: r, score: cosineSimilarity(queryEmbedding, r.embedding!) }))
        .filter(({ score }) => score >= 0.5)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      const favSet = req.user
      ? await favoritedIds(
          app.collections,
          req.user.id,
          'recipe',
          scored.map((s) => s.recipe._id),
        )
      : null;

      return {
        items: scored.map(({ recipe }) =>
          favSet
            ? toRecipe(recipe, {
                isFavorite: favSet.has(
                  recipe._id.toString(),
                ),
              })
            : toRecipe(recipe),
        ),
      };
    },
  );

  // One-time backfill: generate embeddings for every recipe that doesn't have one.
  // Call POST /recipes/backfill-embeddings once after the AI service is running.
  app.post(
    '/recipes/backfill-embeddings',
    { onRequest: [app.authenticate], schema: { tags: ['recipes'] } },
    async () => {
      const recipes = await app.collections.recipes
        .find({ embedding: { $exists: false }, status: { $ne: 'draft' } })
        .toArray();

      let done = 0;
      for (const recipe of recipes) {
        await generateAndStoreEmbedding(app.collections, recipe._id, recipe);
        done++;
      }

      return { backfilled: done, total: recipes.length };
    },
  );
};
