// apps/api/src/modules/recipes/recipes.routes.ts
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ObjectId, type Filter } from 'mongodb';
import { z } from 'zod';
import {
  CreateRecipeInputSchema,
  ExtractFromTextInputSchema,
  ExtractFromTextResultSchema,
  RecipeListQuerySchema,
  UpdateRecipeInputSchema,
} from '@mixer/contracts';
import { config } from '../../config.js';
import type { RecipeDoc } from '../../db/types.js';
import { toRecipe } from './recipes.mapper.js';
import { favoritedIds } from '../favorites/favorites.service.js';
import { saveRecipeImage } from '../uploads/upload.service.js';

const IdParam = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/i) });

function canRead(req: { user?: { id: string; role: string } }, doc: RecipeDoc): boolean {
  if (doc.visibility !== 'private') return true;
  return req.user?.id === doc.ownerId.toString();
}


export const recipesRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('onRequest', async (req, reply) => {
    try {
      await app.authenticate(req, reply);
    } catch (err) {
    }
});
  
  app.post(
    '/recipes',
    {
      onRequest: [app.authenticate],
      schema: { body: CreateRecipeInputSchema, tags: ['recipes'] },
    },
    async (req, reply) => {
      const now = new Date();
      const body = req.body;
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
        createdAt: now,
        updatedAt: now,
      };
      await app.collections.recipes.insertOne(doc);
      return reply.code(201).send(toRecipe(doc));
    },
  );

  app.get(
    '/recipes',
    { schema: { querystring: RecipeListQuerySchema, tags: ['recipes'] } },
    async (req) => {
      const { owner, tag, q, visibility, limit, skip } = req.query;
      const filter: Filter<RecipeDoc> = {};

      if (owner === 'me' && req.user?.id) {
        filter.ownerId = new ObjectId(req.user.id);
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

      if (visibility) filter.visibility = visibility;
      if (tag) filter.tags = tag;
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
    { schema: { params: IdParam, tags: ['recipes'] } },
    async (req, reply) => {
      console.log('USER:', req.user);
      const doc = await app.collections.recipes.findOne({ _id: new ObjectId(req.params.id) });
      if (!doc) return reply.code(404).send({ error: 'recipe not found' });
      if (!canRead(req, doc)) return reply.code(403).send({ error: 'forbidden' });
      if (!req.user) return toRecipe(doc);
      const favSet = await favoritedIds(app.collections, req.user.id, 'recipe', [doc._id]);
      return toRecipe(doc, { isFavorite: favSet.has(doc._id.toString()) });
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
      const { source, ...rest } = req.body;
      const $set: Partial<RecipeDoc> & { updatedAt: Date } = { ...rest, updatedAt: new Date() };
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
      await app.collections.recipes.deleteOne({ _id });
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
        body: JSON.stringify({ text: req.body.text }),
      });

      if (!response.ok) {
        throw new Error('AI service failed to extract recipe');
      }

      const data = await response.json();
      const result = ExtractFromTextResultSchema.parse(data);
      return result;
    },
  );

    app.post(
    '/recipes/:id/cover',
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

      if (recipe.ownerId.toString() !== req.user.id) {
        return reply.code(403).send({
          error: 'not the owner',
        });
      }

      const file = await req.file();

      if (!file) {
        return reply.code(400).send({
          error: 'file is required',
        });
      }

      const imageUrl = await saveRecipeImage(
        file,
        recipeId.toString(),
      );

      await app.collections.recipes.updateOne(
        { _id: recipeId },
        {
          $set: {
            coverImageUrl: imageUrl,
            updatedAt: new Date(),
          },
        },
      );

      return {
        coverImageUrl: imageUrl,
      };
    },
  );
};