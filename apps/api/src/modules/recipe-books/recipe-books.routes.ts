import type { FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import {
  AddBookMemberInputSchema,
  CreateRecipeBookInputSchema,
  RecipeBookSchema,
  UpdateBookMemberInputSchema,
  UpdateRecipeBookInputSchema,
} from '@mixer/contracts';
import type { RecipeBookDoc } from '../../db/types.js';
import { toRecipeBook } from './recipe-books.mapper.js';

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

export async function recipeBooksRoutes(app: FastifyInstance): Promise<void> {
  // Create
  app.post(
    '/recipe-books',
    {
      onRequest: [app.authenticate],
      schema: { body: CreateRecipeBookInputSchema, response: { 201: RecipeBookSchema } },
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
        type: req.body.type,
        members: [{ userId: ownerId, role: 'owner', addedAt: now }],
        recipeIds: [],
        tags: req.body.tags,
        createdAt: now,
        updatedAt: now,
      };
      await app.collections.recipeBooks.insertOne(doc);
      return reply.code(201).send(toRecipeBook(doc));
    },
  );

  // List mine + ones I'm a member of
  app.get(
    '/recipe-books',
    {
      onRequest: [app.authenticate],
      schema: { response: { 200: z.object({ items: z.array(RecipeBookSchema) }) } },
    },
    async (req) => {
      const userId = new ObjectId(req.user.id);
      const items = await app.collections.recipeBooks
        .find({ $or: [{ ownerId: userId }, { 'members.userId': userId }] })
        .sort({ createdAt: -1 })
        .toArray();
      return { items: items.map(toRecipeBook) };
    },
  );

  // Get by id (must be a member)
  app.get(
    '/recipe-books/:id',
    {
      onRequest: [app.authenticate],
      schema: { params: IdParam, response: { 200: RecipeBookSchema } },
    },
    async (req, reply) => {
      const book = await app.collections.recipeBooks.findOne({
        _id: new ObjectId(req.params.id),
      });
      if (!book) return reply.code(404).send({ error: 'book not found' });
      if (!memberRole(book, req.user.id)) {
        return reply.code(403).send({ error: 'not a member' });
      }
      return toRecipeBook(book);
    },
  );

  // Update (owner or editor)
  app.patch(
    '/recipe-books/:id',
    {
      onRequest: [app.authenticate],
      schema: {
        params: IdParam,
        body: UpdateRecipeBookInputSchema,
        response: { 200: RecipeBookSchema },
      },
    },
    async (req, reply) => {
      const _id = new ObjectId(req.params.id);
      const book = await app.collections.recipeBooks.findOne({ _id });
      if (!book) return reply.code(404).send({ error: 'book not found' });
      const role = memberRole(book, req.user.id);
      if (role !== 'owner' && role !== 'editor') {
        return reply.code(403).send({ error: 'editor or owner only' });
      }
      const updated = await app.collections.recipeBooks.findOneAndUpdate(
        { _id },
        { $set: { ...req.body, updatedAt: new Date() } },
        { returnDocument: 'after' },
      );
      return toRecipeBook(updated!);
    },
  );

  // Delete (owner only)
  app.delete(
    '/recipe-books/:id',
    {
      onRequest: [app.authenticate],
      schema: { params: IdParam, response: { 204: z.null() } },
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

  // Add a recipe to the book (owner or editor)
  app.post(
    '/recipe-books/:id/recipes/:recipeId',
    {
      onRequest: [app.authenticate],
      schema: { params: IdAndRecipeParam, response: { 200: RecipeBookSchema } },
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

  // Remove a recipe from the book (owner or editor)
  app.delete(
    '/recipe-books/:id/recipes/:recipeId',
    {
      onRequest: [app.authenticate],
      schema: { params: IdAndRecipeParam, response: { 200: RecipeBookSchema } },
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

  // Add member (owner only)
  app.post(
    '/recipe-books/:id/members',
    {
      onRequest: [app.authenticate],
      schema: {
        params: IdParam,
        body: AddBookMemberInputSchema,
        response: { 200: RecipeBookSchema },
      },
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
      // ensure we don't duplicate
      await app.collections.recipeBooks.updateOne(
        { _id, 'members.userId': { $ne: member.userId } },
        { $push: { members: member }, $set: { updatedAt: new Date() } },
      );
      const updated = await app.collections.recipeBooks.findOne({ _id });
      return toRecipeBook(updated!);
    },
  );

  // Change a member's role (owner only)
  app.patch(
    '/recipe-books/:id/members/:userId',
    {
      onRequest: [app.authenticate],
      schema: {
        params: IdAndUserParam,
        body: UpdateBookMemberInputSchema,
        response: { 200: RecipeBookSchema },
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

  // Remove a member (owner only)
  app.delete(
    '/recipe-books/:id/members/:userId',
    {
      onRequest: [app.authenticate],
      schema: { params: IdAndUserParam, response: { 200: RecipeBookSchema } },
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
}
