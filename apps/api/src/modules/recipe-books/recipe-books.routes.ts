// apps/api/src/modules/recipe-books/recipe-books.routes.ts
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
import { memberRole } from './recipe-books.utils.js';
import { favoritedIds } from '../favorites/favorites.service.js';
import { notificationService } from '../../services/notification.service.js';

const IdParam = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/i) });
const IdAndUserParam = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/i),
  userId: z.string().regex(/^[a-f0-9]{24}$/i),
});
const IdAndRecipeParam = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/i),
  recipeId: z.string().regex(/^[a-f0-9]{24}$/i),
});

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
      const owner = await app.collections.users.findOne(
        { _id: ownerId },
        { projection: { locale: 1 } },
      );
      const language = req.body.language ?? owner?.locale ?? 'en';
      const doc: RecipeBookDoc = {
        _id: new ObjectId(),
        ownerId,
        name: req.body.name,
        description: req.body.description,
        coverImageUrl: req.body.coverImageUrl,
        coverKey: req.body.coverKey,
        type: req.body.type,
        language,
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
        $or: [
          { ownerId: userId },
          { members: { $elemMatch: { userId, status: { $ne: 'pending' } } } },
        ],
        // The auto-created "my recipes" book is where saved recipes are filed behind
        // the scenes; it isn't something the user browses, so it stays out of every
        // list built on this route. Fetching it by id still works.
        system: { $ne: true },
      };
      // Escape regex metacharacters so a user's query is matched literally.
      if (q) filter.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      const items = await app.collections.recipeBooks
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray();
      const favSet = await favoritedIds(
        app.collections,
        req.user.id,
        'book',
        items.map((b) => b._id)
      );
      
        return {
        items: items.map((b) =>
          toRecipeBook(b, {
            isFavorite: favSet.has(b._id.toString()),
          }),
        ),
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
        // Not a member — allow if they have an accepted live-link share for this book
        const liveShare = await app.collections.sharedItems.findOne({
          resourceType: 'book',
          resourceId: book._id,
          friendId: new ObjectId(req.user.id),
          status: 'accepted',
          savedAt: null,
        });
        if (!liveShare) return reply.code(403).send({ error: 'not a member' });
      }
      const favSet = await favoritedIds(
        app.collections,
        req.user.id,
        'book',
        [book._id],
      );
      
      return toRecipeBook(book, {
      isFavorite: favSet.has(book._id.toString()),
      });
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
      if (!book.language) {
        (patch as Record<string, unknown>).language = 'he';
      }
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

      const [liveShares, owner] = await Promise.all([
        app.collections.sharedItems
          .find({ resourceId: _id, status: 'accepted', savedAt: null })
          .toArray(),
        app.collections.users.findOne(
          { _id: new ObjectId(req.user.id) },
          { projection: { displayName: 1 } },
        ),
      ]);

      // Auto-save a copy for every live-link friend and notify them
      await Promise.all(
        liveShares.map(async (share) => {
          try {
            const now = new Date();
            // The recipient owns and browses this copy — never hidden plumbing.
            const { system: _system, ...bookFields } = book;
            const forked: RecipeBookDoc = {
              ...bookFields,
              _id: new ObjectId(),
              ownerId: share.friendId,
              members: [],
              createdAt: now,
              updatedAt: now,
            };
            await app.collections.recipeBooks.insertOne(forked);
            await Promise.all([
              app.collections.sharedItems.updateOne(
                { _id: share._id },
                { $set: { savedAt: now, savedResourceId: forked._id } },
              ),
              notificationService.send(share.friendId.toString(), 'OWNER_DELETED_RESOURCE', {
                fromUserId: req.user.id,
                fromUserName: owner?.displayName ?? '',
                resourceType: 'book',
                resourceName: book.name,
                savedCopyId: forked._id.toString(),
              }),
            ]);
          } catch {
            // best-effort — don't block deletion if fork fails
          }
        }),
      );

      // Notify collaborative members (excluding the owner) that the book is gone
      const collaborators = book.members.filter((m) => m.userId.toString() !== req.user.id);
      await Promise.all(
        collaborators.map((m) =>
          notificationService.send(m.userId.toString(), 'OWNER_DELETED_RESOURCE', {
            fromUserId: req.user.id,
            fromUserName: owner?.displayName ?? '',
            resourceType: 'book',
            resourceName: book.name,
            savedCopyId: '',
          }),
        ),
      );

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
      // Backfill `language` for books created before the field was required by
      // the MongoDB schema validator — without it `findOneAndUpdate` fails with
      // DocumentValidationFailure.
      const setFields: Record<string, unknown> = { updatedAt: new Date() };
      if (!book.language) {
        setFields.language = 'he';
      }
      const updated = await app.collections.recipeBooks.findOneAndUpdate(
        { _id },
        { $addToSet: { recipeIds: recipeOid }, $set: setFields },
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
      const setFields: Record<string, unknown> = { updatedAt: new Date() };
      if (!book.language) {
        setFields.language = 'he';
      }
      const updated = await app.collections.recipeBooks.findOneAndUpdate(
        { _id },
        { $pull: { recipeIds: recipeOid }, $set: setFields },
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
        status: 'pending' as const,
        addedAt: new Date(),
        invitedBy: new ObjectId(req.user.id),
      };
      await app.collections.recipeBooks.updateOne(
        { _id, 'members.userId': { $ne: member.userId } },
        { $push: { members: member }, $set: { updatedAt: new Date() } },
      );

      const [updated, inviter] = await Promise.all([
        app.collections.recipeBooks.findOne({ _id }),
        app.collections.users.findOne(
          { _id: new ObjectId(req.user.id) },
          { projection: { displayName: 1 } },
        ),
      ]);

      await notificationService.send(req.body.userId, 'BOOK_INVITE', {
        fromUserId: req.user.id,
        fromUserName: inviter?.displayName ?? '',
        bookId: _id.toString(),
        bookName: book.name,
        role: req.body.role,
      });

      return toRecipeBook(updated!);
    },
  );

  app.put(
    '/recipe-books/:id/members/accept',
    {
      onRequest: [app.authenticate],
      schema: { params: IdParam, tags: ['recipe-books'] },
    },
    async (req, reply) => {
      const _id = new ObjectId(req.params.id);
      const userOid = new ObjectId(req.user.id);
      const book = await app.collections.recipeBooks.findOne({ _id });
      if (!book) return reply.code(404).send({ error: 'book not found' });

      const hasPending = book.members.some(
        (m) => m.userId.toString() === req.user.id && m.status === 'pending',
      );
      if (!hasPending) return reply.code(404).send({ error: 'pending invite not found' });

      const [updated, invitee] = await Promise.all([
        app.collections.recipeBooks.findOneAndUpdate(
          { _id, 'members.userId': userOid },
          { $set: { 'members.$.status': 'active', updatedAt: new Date() } },
          { returnDocument: 'after' },
        ),
        app.collections.users.findOne(
          { _id: userOid },
          { projection: { displayName: 1 } },
        ),
        app.collections.notifications.deleteOne({
          userId: userOid,
          type: 'BOOK_INVITE',
          'payload.bookId': _id.toString(),
        }),
      ]);
      await notificationService.send(book.ownerId.toString(), 'BOOK_INVITE_ACCEPTED', {
        fromUserId: req.user.id,
        fromUserName: invitee?.displayName ?? '',
        bookId: _id.toString(),
        bookName: book.name,
      });
      return toRecipeBook(updated!);
    },
  );

  app.put(
    '/recipe-books/:id/members/decline',
    {
      onRequest: [app.authenticate],
      schema: { params: IdParam, tags: ['recipe-books'] },
    },
    async (req, reply) => {
      const _id = new ObjectId(req.params.id);
      const userOid = new ObjectId(req.user.id);
      const book = await app.collections.recipeBooks.findOne({ _id });
      if (!book) return reply.code(404).send({ error: 'book not found' });

      const hasPending = book.members.some(
        (m) => m.userId.toString() === req.user.id && m.status === 'pending',
      );
      if (!hasPending) return reply.code(404).send({ error: 'pending invite not found' });

      const [updated, invitee] = await Promise.all([
        app.collections.recipeBooks.findOneAndUpdate(
          { _id },
          { $pull: { members: { userId: userOid } }, $set: { updatedAt: new Date() } },
          { returnDocument: 'after' },
        ),
        app.collections.users.findOne(
          { _id: userOid },
          { projection: { displayName: 1 } },
        ),
        app.collections.notifications.deleteOne({
          userId: userOid,
          type: 'BOOK_INVITE',
          'payload.bookId': _id.toString(),
        }),
      ]);
      await notificationService.send(book.ownerId.toString(), 'BOOK_INVITE_REJECTED', {
        fromUserId: req.user.id,
        fromUserName: invitee?.displayName ?? '',
        bookId: _id.toString(),
        bookName: book.name,
      });
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
      const setFields: Record<string, unknown> = { 'members.$.role': req.body.role, updatedAt: new Date() };
      if (!book.language) setFields.language = 'he';
      const res = await app.collections.recipeBooks.findOneAndUpdate(
        { _id, 'members.userId': userOid },
        { $set: setFields },
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
      // The owner removes anyone; everyone else may only remove themselves
      // ("leave book"). Without the self case a member would be stuck in a book
      // they no longer want.
      const isSelf = req.params.userId === req.user.id;
      if (!isSelf && book.ownerId.toString() !== req.user.id) {
        return reply.code(403).send({ error: 'owner only' });
      }
      // The owner can't leave — an ownerless book would be unreachable. They
      // delete the book instead.
      if (book.ownerId.toString() === req.params.userId) {
        return reply.code(400).send({ error: 'owner cannot leave their own book' });
      }
      const setFields: Record<string, unknown> = { updatedAt: new Date() };
      if (!book.language) setFields.language = 'he';
      const isPending = book.members.some(
        (m) => m.userId.toString() === req.params.userId && m.status === 'pending',
      );
      const [updated] = await Promise.all([
        app.collections.recipeBooks.findOneAndUpdate(
          { _id },
          { $pull: { members: { userId: userOid } }, $set: setFields },
          { returnDocument: 'after' },
        ),
        isPending
          ? app.collections.notifications.deleteOne({
              userId: userOid,
              type: 'BOOK_INVITE',
              'payload.bookId': _id.toString(),
            })
          : Promise.resolve(),
      ]);
      return toRecipeBook(updated!);
    },
  );
};
