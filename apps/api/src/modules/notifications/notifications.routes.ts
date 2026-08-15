import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { NotificationListQuerySchema } from '@mixer/contracts';
import type { NotificationDoc, RecipeDoc, RecipeBookDoc, RecipeIngredient, RecipeStep } from '../../db/types.js';

const IdParam = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/i) });

const ACTIONABLE_TYPES = new Set<NotificationDoc['type']>(['SHARE_REQUEST', 'FRIEND_REQUEST']);

function toNotification(doc: NotificationDoc) {
  return {
    id: doc._id.toString(),
    type: doc.type,
    payload: doc.payload,
    read: doc.read,
    createdAt: doc.createdAt.toISOString(),
    expiresAt: doc.expiresAt?.toISOString() ?? null,
  };
}

export const notificationsRoutes: FastifyPluginAsyncZod = async (app) => {
  // Get notifications for the current user
  app.get(
    '/notifications',
    {
      onRequest: [app.authenticate],
      schema: { querystring: NotificationListQuerySchema, tags: ['notifications'] },
    },
    async (req) => {
      const { read, limit, skip } = req.query;
      const filter: Record<string, unknown> = { userId: new ObjectId(req.user.id) };
      if (read !== undefined) filter.read = read;

      const [items, total, unreadCount] = await Promise.all([
        app.collections.notifications
          .find(filter, { sort: { createdAt: -1 }, limit, skip })
          .toArray(),
        app.collections.notifications.countDocuments(filter),
        app.collections.notifications.countDocuments({
          userId: new ObjectId(req.user.id),
          read: false,
        }),
      ]);

      return { items: items.map(toNotification), total, unreadCount };
    },
  );

  // Mark a notification as read
  // Actionable types (SHARE_REQUEST, FRIEND_REQUEST) are deleted — they belong in the inbox, not the bell
  // Informational types are kept and marked read — TTL will clean them up after 30 days
  app.put(
    '/notifications/:id/read',
    {
      onRequest: [app.authenticate],
      schema: { params: IdParam, tags: ['notifications'] },
    },
    async (req, reply) => {
      const notification = await app.collections.notifications.findOne({
        _id: new ObjectId(req.params.id),
        userId: new ObjectId(req.user.id),
      });
      if (!notification) return reply.code(404).send({ error: 'notification not found' });

      if (ACTIONABLE_TYPES.has(notification.type)) {
        await app.collections.notifications.deleteOne({ _id: notification._id });
      } else {
        await app.collections.notifications.updateOne(
          { _id: notification._id },
          { $set: { read: true } },
        );
      }

      return reply.code(204).send();
    },
  );

  // Delete a notification explicitly
  app.delete(
    '/notifications/:id',
    {
      onRequest: [app.authenticate],
      schema: { params: IdParam, tags: ['notifications'] },
    },
    async (req, reply) => {
      const result = await app.collections.notifications.deleteOne({
        _id: new ObjectId(req.params.id),
        userId: new ObjectId(req.user.id),
      });
      if (result.deletedCount === 0) return reply.code(404).send({ error: 'notification not found' });
      return reply.code(204).send();
    },
  );

  // Save the pending copy from an OWNER_DELETED_RESOURCE notification.
  // Creates a fork from the snapshot stored in the notification payload,
  // adds it to the user's personal book, and deletes the notification.
  app.post(
    '/notifications/:id/save',
    {
      onRequest: [app.authenticate],
      schema: { params: IdParam, tags: ['notifications'] },
    },
    async (req, reply) => {
      const notification = await app.collections.notifications.findOne({
        _id: new ObjectId(req.params.id),
        userId: new ObjectId(req.user.id),
      });
      if (!notification) return reply.code(404).send({ error: 'notification not found' });
      if (notification.type !== 'OWNER_DELETED_RESOURCE') {
        return reply.code(400).send({ error: 'not a pending copy notification' });
      }

      const payload = notification.payload;
      const snapshot = payload._snapshot as Record<string, unknown> | undefined;
      const payloadKeys = Object.keys(payload);
      app.log.info({ payloadKeys, resourceType: payload.resourceType, notificationId: req.params.id }, '[notifications/save] incoming save request');

      // Legacy: notification was created by old code that attempted to auto-fork on deletion.
      // savedCopyId is the ID of the copy if the fork succeeded, or null if it failed.
      if (!snapshot && 'savedCopyId' in payload) {
        await app.collections.notifications.deleteOne({ _id: notification._id });
        const legacyId = payload.savedCopyId;
        if (legacyId) {
          return reply.code(201).send({ id: legacyId.toString(), resourceType: payload.resourceType as string });
        }
        // Fork failed at creation time — no copy exists and no snapshot to recreate from.
        return reply.code(400).send({ error: 'copy could not be recovered' });
      }

      if (!snapshot) {
        app.log.warn({ payloadKeys, notificationId: req.params.id }, '[notifications/save] no snapshot');
        return reply.code(400).send({ error: 'no snapshot available', payloadKeys });
      }

      const userId = new ObjectId(req.user.id);
      const now = new Date();
      let savedId: string;

      try {
        if (payload.resourceType === 'recipe') {
          const doc: RecipeDoc = {
            _id: new ObjectId(),
            ownerId: userId,
            title: snapshot.title as string,
            description: snapshot.description as string | undefined,
            coverImageUrl: snapshot.coverImageUrl as string | undefined,
            ingredients: snapshot.ingredients as RecipeIngredient[],
            steps: snapshot.steps as RecipeStep[],
            servings: snapshot.servings as number | undefined,
            prepTimeMinutes: snapshot.prepTimeMinutes as number | undefined,
            cookTimeMinutes: snapshot.cookTimeMinutes as number | undefined,
            difficulty: snapshot.difficulty as 'easy' | 'medium' | 'hard' | undefined,
            cuisine: snapshot.cuisine as string | undefined,
            tags: (snapshot.tags as string[]) ?? [],
            categoryIds: ((snapshot.categoryIds as string[]) ?? []).map((id) => new ObjectId(id)),
            language: (snapshot.language as 'he' | 'en') ?? 'he',
            source: snapshot.source as RecipeDoc['source'],
            visibility: 'private',
            status: 'published',
            createdAt: now,
            updatedAt: now,
          };
          await app.collections.recipes.insertOne(doc);
          savedId = doc._id.toString();

          const personalBook = await app.collections.recipeBooks.findOne({
            ownerId: userId,
            type: 'personal',
          });
          if (personalBook) {
            await app.collections.recipeBooks.updateOne(
              { _id: personalBook._id },
              { $addToSet: { recipeIds: doc._id }, $set: { updatedAt: now } },
            );
          }
        } else {
          // Fork every recipe that still exists in the DB.
          // Recipes deleted between the book deletion and this accept are silently skipped.
          const originalIds = ((snapshot.recipeIds as string[]) ?? []).map((id) => new ObjectId(id));
          const forkedRecipeIds: ObjectId[] = [];
          app.log.info({ recipeCount: originalIds.length, bookName: snapshot.name }, '[notifications/save] forking book');
          for (const recipeId of originalIds) {
            const source = await app.collections.recipes.findOne({ _id: recipeId });
            if (!source) { app.log.warn({ recipeId: recipeId.toString() }, '[notifications/save] recipe not found, skipping'); continue; }
            const fork: RecipeDoc = {
              ...source,
              _id: new ObjectId(),
              ownerId: userId,
              visibility: 'private',
              forkedFrom: source._id,
              forkedAt: now,
              createdAt: now,
              updatedAt: now,
            };
            await app.collections.recipes.insertOne(fork);
            forkedRecipeIds.push(fork._id);
          }

          const doc: RecipeBookDoc = {
            _id: new ObjectId(),
            ownerId: userId,
            name: snapshot.name as string,
            description: snapshot.description as string | undefined,
            coverImageUrl: snapshot.coverImageUrl as string | undefined,
            coverKey: snapshot.coverKey as string | undefined,
            type: (snapshot.type as 'personal' | 'shared' | 'meal') ?? 'shared',
            language: (snapshot.language as 'he' | 'en') ?? 'he',
            members: [],
            recipeIds: forkedRecipeIds,
            tags: (snapshot.tags as string[]) ?? [],
            createdAt: now,
            updatedAt: now,
          };
          await app.collections.recipeBooks.insertOne(doc);
          savedId = doc._id.toString();
        }
      } catch (e) {
        app.log.error(e, '[notifications/save] failed to create fork from snapshot');
        return reply.code(500).send({ error: 'failed to save copy' });
      }

      await app.collections.notifications.deleteOne({ _id: notification._id });
      return reply.code(201).send({ id: savedId, resourceType: payload.resourceType });
    },
  );

  // Mark all as read — deletes actionable ones, marks informational ones as read
  app.put(
    '/notifications/read-all',
    {
      onRequest: [app.authenticate],
      schema: { tags: ['notifications'] },
    },
    async (req) => {
      const userId = new ObjectId(req.user.id);
      const actionableTypes = [...ACTIONABLE_TYPES];

      await Promise.all([
        app.collections.notifications.deleteMany({
          userId,
          type: { $in: actionableTypes },
        }),
        app.collections.notifications.updateMany(
          { userId, type: { $nin: actionableTypes }, read: false },
          { $set: { read: true } },
        ),
      ]);

      return { ok: true };
    },
  );
};
