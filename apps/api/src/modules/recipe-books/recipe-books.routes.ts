import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import {
  AddBookMemberInputSchema,
  CreateRecipeBookInputSchema,
  RecipeBookListQuerySchema,
  UpdateBookMemberInputSchema,
  UpdateRecipeBookInputSchema,
} from '@mixer/contracts';
import type { Filter } from 'mongodb';
import type { RecipeBookDoc } from '../../db/types.js';
import { toRecipeBook } from './recipe-books.mapper.js';
import { favoritedIds } from '../favorites/favorites.service.js';

const IdParam = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/i) });
const IdAndUserParam = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/i),
  userId: z.string().regex(/^[a-f0-9]{24}$/i),
});
const IdAndRecipeParam = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/i),
  recipeId: z.string().regex(/^[a-f0-9]{24}$/i),
});

function memberRole(book: RecipeBookDoc, userId: string): 'owner' | 'editor' | 'viewer' | null {
  if (book.ownerId.toString() === userId) return 'owner';
  const m = book.members.find((m) => m.userId.toString() === userId);
  return m?.role ?? null;
}

export const recipeBooksRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/recipe-books',
    {
      onRequest: [app.authenticate],
      schema: { body: CreateRecipeBookInputSchema, tags: ['recipe-books'] },
    },
    async (req, reply) => {
      const ownerId = new ObjectId(req.user.id);
      const now = new Date();
      const doc: RecipeBookDoc = {
        _id: new ObjectId(),
        ownerId,
        name: req.body.name,
        description: req.body.description,
        coverImageUrl: req.body.coverImageUrl,
        coverKey: req.body.coverKey,
        type: req.body.type,
        members: [{ userId: ownerId, role: 'owner', addedAt: now }],
        recipeIds: req.body.recipeIds.map((id) => new ObjectId(id)),
        tags: req.body.tags,
        createdAt: now,
        updatedAt: now,
      };
      await app.collections.recipeBooks.insertOne(doc);
      return reply.code(201).send(toRecipeBook(doc));
    },
  );

  app.get(
    '/recipe-books',
    {
      onRequest: [app.authenticate],
      schema: { querystring: RecipeBookListQuerySchema, tags: ['recipe-books'] },
    },
    async (req) => {
      const userId = new ObjectId(req.user.id);
      const { q } = req.query;
      const filter: Filter<RecipeBookDoc> = {
        $or: [{ ownerId: userId }, { 'members.userId': userId }],
      };
      // Escape regex metacharacters so a user's query is matched literally.
      if (q) filter.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      const items = await app.collections.recipeBooks
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray();
      const favSet = await favoritedIds(app.collections, req.user.id, 'book', items.map((b) => b._id));
      return {
        items: items.map((b) => toRecipeBook(b, { isFavorite: favSet.has(b._id.toString()) })),
      };
    },
  );

  app.get(
    '/recipe-books/:id',
    { onRequest: [app.authenticate], schema: { params: IdParam, tags: ['recipe-books'] } },
    async (req, reply) => {
      const book = await app.collections.recipeBooks.findOne({
        _id: new ObjectId(req.params.id),
      });
      if (!book) return reply.code(404).send({ error: 'book not found' });
      if (!memberRole(book, req.user.id)) {
        return reply.code(403).send({ error: 'not a member' });
      }
      const favSet = await favoritedIds(app.collections, req.user.id, 'book', [book._id]);
      return toRecipeBook(book, { isFavorite: favSet.has(book._id.toString()) });
    },
  );

  app.patch(
    '/recipe-books/:id',
    {
      onRequest: [app.authenticate],
      schema: { params: IdParam, body: UpdateRecipeBookInputSchema, tags: ['recipe-books'] },
    },
    async (req, reply) => {
      const _id = new ObjectId(req.params.id);
      const book = await app.collections.recipeBooks.findOne({ _id });
      if (!book) return reply.code(404).send({ error: 'book not found' });
      const role = memberRole(book, req.user.id);
      if (role !== 'owner' && role !== 'editor') {
        return reply.code(403).send({ error: 'editor or owner only' });
      }
      // recipeIds are managed via the dedicated add/remove-recipe endpoints, not this
      // generic update (and the input carries them as strings, not ObjectIds).
      const { recipeIds: _ignored, ...patch } = req.body;
      const updated = await app.collections.recipeBooks.findOneAndUpdate(
        { _id },
        { $set: { ...patch, updatedAt: new Date() } },
        { returnDocument: 'after' },
      );
      return toRecipeBook(updated!);
    },
  );

  app.delete(
    '/recipe-books/:id',
    {
      onRequest: [app.authenticate],
      schema: { params: IdParam, tags: ['recipe-books'] },
    },
    async (req, reply) => {
      const _id = new ObjectId(req.params.id);
      const book = await app.collections.recipeBooks.findOne({ _id });
      if (!book) return reply.code(404).send({ error: 'book not found' });
      if (book.ownerId.toString() !== req.user.id) {
        return reply.code(403).send({ error: 'owner only' });
      }
      await app.collections.recipeBooks.deleteOne({ _id });
      return reply.code(204).send();
    },
  );

  app.post(
    '/recipe-books/:id/recipes/:recipeId',
    {
      onRequest: [app.authenticate],
      schema: { params: IdAndRecipeParam, tags: ['recipe-books'] },
    },
    async (req, reply) => {
      const _id = new ObjectId(req.params.id);
      const recipeOid = new ObjectId(req.params.recipeId);
      const book = await app.collections.recipeBooks.findOne({ _id });
      if (!book) return reply.code(404).send({ error: 'book not found' });
      const role = memberRole(book, req.user.id);
      if (role !== 'owner' && role !== 'editor') {
        return reply.code(403).send({ error: 'editor or owner only' });
      }
      const updated = await app.collections.recipeBooks.findOneAndUpdate(
        { _id },
        { $addToSet: { recipeIds: recipeOid }, $set: { updatedAt: new Date() } },
        { returnDocument: 'after' },
      );
      return toRecipeBook(updated!);
    },
  );

  app.delete(
    '/recipe-books/:id/recipes/:recipeId',
    {
      onRequest: [app.authenticate],
      schema: { params: IdAndRecipeParam, tags: ['recipe-books'] },
    },
    async (req, reply) => {
      const _id = new ObjectId(req.params.id);
      const recipeOid = new ObjectId(req.params.recipeId);
      const book = await app.collections.recipeBooks.findOne({ _id });
      if (!book) return reply.code(404).send({ error: 'book not found' });
      const role = memberRole(book, req.user.id);
      if (role !== 'owner' && role !== 'editor') {
        return reply.code(403).send({ error: 'editor or owner only' });
      }
      const updated = await app.collections.recipeBooks.findOneAndUpdate(
        { _id },
        { $pull: { recipeIds: recipeOid }, $set: { updatedAt: new Date() } },
        { returnDocument: 'after' },
      );
      return toRecipeBook(updated!);
    },
  );

  app.post(
    '/recipe-books/:id/members',
    {
      onRequest: [app.authenticate],
      schema: { params: IdParam, body: AddBookMemberInputSchema, tags: ['recipe-books'] },
    },
    async (req, reply) => {
      const _id = new ObjectId(req.params.id);
      const book = await app.collections.recipeBooks.findOne({ _id });
      if (!book) return reply.code(404).send({ error: 'book not found' });
      if (book.ownerId.toString() !== req.user.id) {
        return reply.code(403).send({ error: 'owner only' });
      }
      const member = {
        userId: new ObjectId(req.body.userId),
        role: req.body.role,
        addedAt: new Date(),
        invitedBy: new ObjectId(req.user.id),
      };
      await app.collections.recipeBooks.updateOne(
        { _id, 'members.userId': { $ne: member.userId } },
        { $push: { members: member }, $set: { updatedAt: new Date() } },
      );
      const updated = await app.collections.recipeBooks.findOne({ _id });
      return toRecipeBook(updated!);
    },
  );

  app.patch(
    '/recipe-books/:id/members/:userId',
    {
      onRequest: [app.authenticate],
      schema: {
        params: IdAndUserParam,
        body: UpdateBookMemberInputSchema,
        tags: ['recipe-books'],
      },
    },
    async (req, reply) => {
      const _id = new ObjectId(req.params.id);
      const userOid = new ObjectId(req.params.userId);
      const book = await app.collections.recipeBooks.findOne({ _id });
      if (!book) return reply.code(404).send({ error: 'book not found' });
      if (book.ownerId.toString() !== req.user.id) {
        return reply.code(403).send({ error: 'owner only' });
      }
      const res = await app.collections.recipeBooks.findOneAndUpdate(
        { _id, 'members.userId': userOid },
        { $set: { 'members.$.role': req.body.role, updatedAt: new Date() } },
        { returnDocument: 'after' },
      );
      if (!res) return reply.code(404).send({ error: 'member not found' });
      return toRecipeBook(res);
    },
  );

  app.delete(
    '/recipe-books/:id/members/:userId',
    {
      onRequest: [app.authenticate],
      schema: { params: IdAndUserParam, tags: ['recipe-books'] },
    },
    async (req, reply) => {
      const _id = new ObjectId(req.params.id);
      const userOid = new ObjectId(req.params.userId);
      const book = await app.collections.recipeBooks.findOne({ _id });
      if (!book) return reply.code(404).send({ error: 'book not found' });
      if (book.ownerId.toString() !== req.user.id) {
        return reply.code(403).send({ error: 'owner only' });
      }
      const updated = await app.collections.recipeBooks.findOneAndUpdate(
        { _id },
        { $pull: { members: { userId: userOid } }, $set: { updatedAt: new Date() } },
        { returnDocument: 'after' },
      );
      return toRecipeBook(updated!);
    },
  );
};
