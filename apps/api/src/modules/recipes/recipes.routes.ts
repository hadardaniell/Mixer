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
import { toRecipe } from './recipes.mapper.js';
import { favoritedIds } from '../favorites/favorites.service.js';
import { notificationService } from '../../services/notification.service.js';
import { generateAndStoreCoverImage, getSuggestedCoverImageUrl } from './recipes.service.js';

const IdParam = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/i) });

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * (b[i] ?? 0), 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

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

function canRead(req: { user?: { id: string; role: string } }, doc: RecipeDoc): boolean {
  if (doc.visibility !== 'private') return true;
  return req.user?.id === doc.ownerId.toString();
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
    const hit = cleaned.some((tag) =>
      keys.some((k) => k.length > 1 && (k === tag || k.includes(tag) || tag.includes(k))),
    );
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
        if (!canRead(req, original)) return reply.code(403).send({ error: 'forbidden' });

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
        filter.$or = [
          { ownerId: new ObjectId(req.user.id) },
          { visibility: { $ne: 'private' } },
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
      if (q) filter.$text = { $search: q };

      const cursor = app.collections.recipes.find(filter, {
        sort: { createdAt: -1 },
        limit,
        skip,
      });
      const [items, total] = await Promise.all([
        cursor.toArray(),
        app.collections.recipes.countDocuments(filter),
      ]);

      let targetLang: 'he' | 'en' = 'he';
    if (req.user) {
      const userDoc = await app.collections.users.findOne({ _id: new ObjectId(req.user.id) });
      if (userDoc?.locale) {
        targetLang = userDoc.locale as 'he' | 'en';
      }
    }
 
    const recipeIds = items.map((r) => r._id);
    const translations = await app.collections.recipeTranslations
      ?.find({
        recipeId: { $in: recipeIds },
        language: targetLang,
      })
      .toArray() ?? [];

    const translationMap = new Map(translations.map((t) => [t.recipeId.toString(), t]));

    const translatedItems = items.map((doc) => {
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

      const favSet = req.user
        ? await favoritedIds(app.collections, req.user.id, 'recipe', items.map((r) => r._id))
        : null;
      return {
        items: translatedItems.map((r) =>
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
    if (!canRead(req, doc)) return reply.code(403).send({ error: 'forbidden' });

    let targetLang: 'he' | 'en' = 'he';
    if (req.user) {
      const userDoc = await app.collections.users.findOne({ _id: new ObjectId(req.user.id) });
      if (userDoc?.locale) {
        targetLang = userDoc.locale;
      }
    }

    let finalDoc = doc;

    if (doc.language && doc.language !== targetLang) {
      try {
        const cachedTranslation = await app.collections.recipeTranslations?.findOne({
          recipeId: doc._id,
          language: targetLang,
        });

        if (cachedTranslation) {
          app.log.info(`[recipes/:id] Translation cache hit for recipe ${doc._id}`);
          finalDoc = {
            ...doc,
            title: cachedTranslation.title,
            description: cachedTranslation.description,
            tags: cachedTranslation.tags ?? doc.tags, 
            cuisine: cachedTranslation.cuisine ?? doc.cuisine,
            ingredients: cachedTranslation.ingredients,
            steps: cachedTranslation.steps,
            language: targetLang,
          };
        } else {
          app.log.info(`[recipes/:id] Translation cache miss - calling AI for recipe ${doc._id}`);
          const response = await fetch(`${config.aiBaseUrl}/translate/recipe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipe: {
                title: doc.title,
                description: doc.description,
                tags: doc.tags, 
                cuisine: doc.cuisine,
                ingredients: doc.ingredients,
                steps: doc.steps,
              },
              targetLanguage: targetLang,
            }),
          });

          if (response.ok) {
            const translatedData = (await response.json()) as {
              title: string;
              description?: string;
              tags?: string[];
              cuisine?: string;
              ingredients: RecipeDoc['ingredients'];
              steps: RecipeDoc['steps'];
            };

            await app.collections.recipeTranslations
              ?.insertOne({
                _id: new ObjectId(),
                recipeId: doc._id,
                language: targetLang,
                title: translatedData.title,
                description: translatedData.description,
                tags: translatedData.tags ?? doc.tags, 
                cuisine: translatedData.cuisine ?? doc.cuisine,
                ingredients: translatedData.ingredients,
                steps: translatedData.steps,
                createdAt: new Date(),
              })
              .catch(() => {}); 

            finalDoc = {
              ...doc,
              ...translatedData,
              language: targetLang,
            };
          }
        }
      } catch (error) {
        app.log.error(error, '[recipes/:id] AI translation failed, falling back to original doc');
      }
    }

    if (!req.user) return toRecipe(finalDoc);

    const favSet = await favoritedIds(app.collections, req.user.id, 'recipe', [doc._id]);
    return toRecipe(finalDoc, { isFavorite: favSet.has(doc._id.toString()) });
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
        body: z.object({ url: z.string().url() }),
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

      // Check global cache first — if any user already extracted this URL, reuse it
      const cached = await app.collections.urlExtractionCache.findOne({ url });
      if (cached) {
        app.log.info(`[import/url] Cache hit for ${url}`);
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
      app.log.info(`[import/url] Cache miss — calling AI for ${url}`);
      const response = await fetch(`${config.aiBaseUrl}/extract/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
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
        .insertOne({ _id: new ObjectId(), url, extraction, extractedAt: new Date() })
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
        response: { 200: ExtractFromTextResultSchema },
        tags: ['recipes'],
      },
    },
    async (req) => {
      const response = await fetch(`${config.aiBaseUrl}/extract/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: req.body.images, locale: req.body.locale }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        if (data?.message === 'images_not_same_recipe') {
          throw new Error('images_not_same_recipe');
        }
        throw new Error('AI service failed to extract recipe from image');
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

      const visibilityFilter: Filter<RecipeDoc> = req.user
        ? { $or: [{ ownerId: new ObjectId(req.user.id) }, { visibility: { $in: ['public', 'unlisted'] } }] }
        : { visibility: { $in: ['public', 'unlisted'] } };

      const recipes = await app.collections.recipes
        // Exclude drafts — search should only surface published recipes, even
        // the caller's own (which the visibility filter would otherwise include).
        .find({ ...visibilityFilter, status: { $ne: 'draft' }, embedding: { $exists: true } })
        .toArray();

      const scored = recipes
        .map((r) => ({ recipe: r, score: cosineSimilarity(queryEmbedding, r.embedding!) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

        let targetLang: 'he' | 'en' = 'he';
      if (req.user) {
        const userDoc = await app.collections.users.findOne({ _id: new ObjectId(req.user.id) });
        if (userDoc?.locale) {
          targetLang = userDoc.locale as 'he' | 'en';
        }
      }

      const recipeIds = scored.map((s) => s.recipe._id);
      const translations = await app.collections.recipeTranslations
        ?.find({
          recipeId: { $in: recipeIds },
          language: targetLang,
        })
        .toArray() ?? [];

      const translationMap = new Map(translations.map((t) => [t.recipeId.toString(), t]));

      const translatedScored = scored.map(({ recipe, score }) => {
        let finalRecipe = recipe;
        if (recipe.language && recipe.language !== targetLang) {
          const cached = translationMap.get(recipe._id.toString());
          if (cached) {
            finalRecipe = {
              ...recipe,
              title: cached.title,
              description: cached.description,
              tags: cached.tags ?? recipe.tags,
              cuisine: cached.cuisine ?? recipe.cuisine,
              language: targetLang,
            };
          }
        }
        return { recipe: finalRecipe, score };
      });

      const favSet = req.user
        ? await favoritedIds(app.collections, req.user.id, 'recipe', translatedScored.map((s) => s.recipe._id))
        : null;

      return {
       items: translatedScored.map(({ recipe }) =>
          favSet ? toRecipe(recipe, { isFavorite: favSet.has(recipe._id.toString()) }) : toRecipe(recipe),
        ),
      };
    },
  );
};
