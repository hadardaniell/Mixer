import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { CreateShareInputSchema, ShareListQuerySchema } from '@mixer/contracts';
import type { RecipeBookDoc, RecipeDoc, SharedItemDoc } from '../../db/types.js';
import type { Collections } from '../../plugins/mongo.js';
import { notificationService } from '../../services/notification.service.js';

const IdParam = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/i) });

async function resolveResourceName(
  collections: Collections,
  resourceType: 'recipe' | 'book',
  resourceId: ObjectId,
): Promise<string> {
  if (resourceType === 'recipe') {
    const r = await collections.recipes.findOne({ _id: resourceId }, { projection: { title: 1 } });
    return r?.title ?? 'Deleted recipe';
  }
  const b = await collections.recipeBooks.findOne({ _id: resourceId }, { projection: { name: 1 } });
  return b?.name ?? 'Deleted book';
}

function toSharedItem(doc: SharedItemDoc, resourceName: string, ownerName: string) {
  return {
    id: doc._id.toString(),
    resourceType: doc.resourceType,
    resourceId: doc.resourceId.toString(),
    resourceName,
    ownerId: doc.ownerId.toString(),
    ownerName,
    friendId: doc.friendId.toString(),
    status: doc.status,
    savedAt: doc.savedAt?.toISOString() ?? null,
    savedResourceId: doc.savedResourceId?.toString() ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}

async function forkRecipe(
  collections: Collections,
  sourceId: ObjectId,
  newOwnerId: ObjectId,
): Promise<ObjectId> {
  const source = await collections.recipes.findOne({ _id: sourceId });
  if (!source) throw new Error('source not found');
  const now = new Date();
  const fork: RecipeDoc = {
    ...source,
    _id: new ObjectId(),
    ownerId: newOwnerId,
    visibility: 'private',
    forkedFrom: source._id,
    forkedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  await collections.recipes.insertOne(fork);
  return fork._id;
}

async function forkBook(
  collections: Collections,
  sourceId: ObjectId,
  newOwnerId: ObjectId,
): Promise<ObjectId> {
  const source = await collections.recipeBooks.findOne({ _id: sourceId });
  if (!source) throw new Error('source not found');
  const now = new Date();
  const fork: RecipeBookDoc = {
    ...source,
    _id: new ObjectId(),
    ownerId: newOwnerId,
    members: [],
    createdAt: now,
    updatedAt: now,
  };
  await collections.recipeBooks.insertOne(fork);
  return fork._id;
}

export const sharesRoutes: FastifyPluginAsyncZod = async (app) => {
  // Send a share request
  app.post(
    '/shares',
    { onRequest: [app.authenticate], schema: { body: CreateShareInputSchema, tags: ['shares'] } },
    async (req, reply) => {
      const { resourceType, resourceId: resourceIdStr, friendId: friendIdStr } = req.body;
      const resourceId = new ObjectId(resourceIdStr);
      const friendId = new ObjectId(friendIdStr);
      const ownerId = new ObjectId(req.user.id);

      if (req.user.id === friendIdStr) {
        return reply.code(400).send({ error: 'cannot share with yourself' });
      }

      // Validate the resource exists and caller owns it
      if (resourceType === 'recipe') {
        const recipe = await app.collections.recipes.findOne(
          { _id: resourceId },
          { projection: { ownerId: 1 } },
        );
        if (!recipe) return reply.code(404).send({ error: 'recipe not found' });
        if (recipe.ownerId.toString() !== req.user.id) {
          return reply.code(403).send({ error: 'not the owner' });
        }
      } else {
        const book = await app.collections.recipeBooks.findOne(
          { _id: resourceId },
          { projection: { ownerId: 1 } },
        );
        if (!book) return reply.code(404).send({ error: 'book not found' });
        if (book.ownerId.toString() !== req.user.id) {
          return reply.code(403).send({ error: 'not the owner' });
        }
      }

      const friend = await app.collections.users.findOne(
        { _id: friendId },
        { projection: { displayName: 1 } },
      );
      if (!friend) return reply.code(404).send({ error: 'user not found' });

      const existing = await app.collections.sharedItems.findOne({
        resourceId,
        friendId,
        status: { $in: ['pending', 'accepted'] },
      });
      if (existing) return reply.code(409).send({ error: 'already shared with this user' });

      const now = new Date();
      const doc: SharedItemDoc = {
        _id: new ObjectId(),
        resourceType,
        resourceId,
        ownerId,
        friendId,
        status: 'pending',
        savedAt: null,
        savedResourceId: null,
        createdAt: now,
      };
      await app.collections.sharedItems.insertOne(doc);

      const [resourceName, owner] = await Promise.all([
        resolveResourceName(app.collections, resourceType, resourceId),
        app.collections.users.findOne({ _id: ownerId }, { projection: { displayName: 1 } }),
      ]);

      await notificationService.send(friendIdStr, 'SHARE_REQUEST', {
        fromUserId: req.user.id,
        resourceType,
        resourceId: resourceIdStr,
        resourceName,
        shareId: doc._id.toString(),
      });

      return reply.code(201).send(toSharedItem(doc, resourceName, owner?.displayName ?? ''));
    },
  );

  // Accept a share request
  app.put(
    '/shares/:id/accept',
    { onRequest: [app.authenticate], schema: { params: IdParam, tags: ['shares'] } },
    async (req, reply) => {
      const share = await app.collections.sharedItems.findOne({ _id: new ObjectId(req.params.id) });
      if (!share) return reply.code(404).send({ error: 'share not found' });
      if (share.friendId.toString() !== req.user.id) return reply.code(403).send({ error: 'forbidden' });
      if (share.status !== 'pending') return reply.code(409).send({ error: 'share is not pending' });

      const updated = await app.collections.sharedItems.findOneAndUpdate(
        { _id: share._id },
        { $set: { status: 'accepted' } },
        { returnDocument: 'after' },
      );

      const [resourceName, owner] = await Promise.all([
        resolveResourceName(app.collections, share.resourceType, share.resourceId),
        app.collections.users.findOne({ _id: share.ownerId }, { projection: { displayName: 1 } }),
      ]);

      await notificationService.send(share.ownerId.toString(), 'SHARE_ACCEPTED', {
        fromUserId: req.user.id,
        resourceType: share.resourceType,
        resourceId: share.resourceId.toString(),
        resourceName,
      });

      return toSharedItem(updated!, resourceName, owner?.displayName ?? '');
    },
  );

  // Reject a share request
  app.put(
    '/shares/:id/reject',
    { onRequest: [app.authenticate], schema: { params: IdParam, tags: ['shares'] } },
    async (req, reply) => {
      const share = await app.collections.sharedItems.findOne({ _id: new ObjectId(req.params.id) });
      if (!share) return reply.code(404).send({ error: 'share not found' });
      if (share.friendId.toString() !== req.user.id) return reply.code(403).send({ error: 'forbidden' });
      if (share.status !== 'pending') return reply.code(409).send({ error: 'share is not pending' });

      const updated = await app.collections.sharedItems.findOneAndUpdate(
        { _id: share._id },
        { $set: { status: 'rejected' } },
        { returnDocument: 'after' },
      );

      const [resourceName, owner] = await Promise.all([
        resolveResourceName(app.collections, share.resourceType, share.resourceId),
        app.collections.users.findOne({ _id: share.ownerId }, { projection: { displayName: 1 } }),
      ]);

      await notificationService.send(share.ownerId.toString(), 'SHARE_REJECTED', {
        fromUserId: req.user.id,
        resourceType: share.resourceType,
        resourceId: share.resourceId.toString(),
        resourceName,
      });

      return toSharedItem(updated!, resourceName, owner?.displayName ?? '');
    },
  );

  // Save (fork) a live-link shared resource into your own copy
  app.post(
    '/shares/:id/save',
    { onRequest: [app.authenticate], schema: { params: IdParam, tags: ['shares'] } },
    async (req, reply) => {
      const share = await app.collections.sharedItems.findOne({ _id: new ObjectId(req.params.id) });
      if (!share) return reply.code(404).send({ error: 'share not found' });
      if (share.friendId.toString() !== req.user.id) return reply.code(403).send({ error: 'forbidden' });
      if (share.status !== 'accepted') return reply.code(409).send({ error: 'share not accepted yet' });
      if (share.savedAt !== null) return reply.code(409).send({ error: 'already saved' });

      const friendObjId = new ObjectId(req.user.id);
      let savedResourceId: ObjectId;

      try {
        savedResourceId =
          share.resourceType === 'recipe'
            ? await forkRecipe(app.collections, share.resourceId, friendObjId)
            : await forkBook(app.collections, share.resourceId, friendObjId);
      } catch {
        return reply.code(404).send({ error: `${share.resourceType} no longer exists` });
      }

      const now = new Date();
      const updated = await app.collections.sharedItems.findOneAndUpdate(
        { _id: share._id },
        { $set: { savedAt: now, savedResourceId } },
        { returnDocument: 'after' },
      );

      const [resourceName, owner] = await Promise.all([
        resolveResourceName(app.collections, share.resourceType, share.resourceId),
        app.collections.users.findOne({ _id: share.ownerId }, { projection: { displayName: 1 } }),
      ]);

      return reply.code(201).send(toSharedItem(updated!, resourceName, owner?.displayName ?? ''));
    },
  );

  // Remove a share (friend removes from view, or owner revokes)
  // If owner revokes an accepted live-link share, the friend's copy is auto-saved first
  app.delete(
    '/shares/:id',
    { onRequest: [app.authenticate], schema: { params: IdParam, tags: ['shares'] } },
    async (req, reply) => {
      const share = await app.collections.sharedItems.findOne({ _id: new ObjectId(req.params.id) });
      if (!share) return reply.code(404).send({ error: 'share not found' });

      const isFriend = share.friendId.toString() === req.user.id;
      const isOwner = share.ownerId.toString() === req.user.id;
      if (!isFriend && !isOwner) return reply.code(403).send({ error: 'forbidden' });

      if (isOwner && share.status === 'accepted' && share.savedAt === null) {
        const resourceName = await resolveResourceName(
          app.collections,
          share.resourceType,
          share.resourceId,
        );
        try {
          const savedCopyId =
            share.resourceType === 'recipe'
              ? await forkRecipe(app.collections, share.resourceId, share.friendId)
              : await forkBook(app.collections, share.resourceId, share.friendId);

          await notificationService.send(share.friendId.toString(), 'OWNER_DELETED_RESOURCE', {
            fromUserId: req.user.id,
            resourceType: share.resourceType,
            resourceName,
            savedCopyId: savedCopyId.toString(),
          });
        } catch {
          // resource already gone — no fork needed, just clean up the share
        }
      }

      await app.collections.sharedItems.deleteOne({ _id: share._id });
      return reply.code(204).send();
    },
  );

  // Inbox — shares received by the current user
  app.get(
    '/shares/received',
    { onRequest: [app.authenticate], schema: { querystring: ShareListQuerySchema, tags: ['shares'] } },
    async (req) => {
      const { status, limit, skip } = req.query;
      const filter: Record<string, unknown> = { friendId: new ObjectId(req.user.id) };
      if (status) filter.status = status;

      const [items, total] = await Promise.all([
        app.collections.sharedItems
          .find(filter, { sort: { createdAt: -1 }, limit, skip })
          .toArray(),
        app.collections.sharedItems.countDocuments(filter),
      ]);

      const ownerIds = [...new Set(items.map((i) => i.ownerId.toString()))];
      const owners = await app.collections.users
        .find(
          { _id: { $in: ownerIds.map((id) => new ObjectId(id)) } },
          { projection: { displayName: 1 } },
        )
        .toArray();
      const ownerMap = Object.fromEntries(owners.map((u) => [u._id.toString(), u.displayName]));

      const enriched = await Promise.all(
        items.map(async (item) => {
          const name = await resolveResourceName(app.collections, item.resourceType, item.resourceId);
          return toSharedItem(item, name, ownerMap[item.ownerId.toString()] ?? '');
        }),
      );

      return { items: enriched, total };
    },
  );

  // Outbox — shares sent by the current user
  app.get(
    '/shares/sent',
    { onRequest: [app.authenticate], schema: { querystring: ShareListQuerySchema, tags: ['shares'] } },
    async (req) => {
      const { status, limit, skip } = req.query;
      const filter: Record<string, unknown> = { ownerId: new ObjectId(req.user.id) };
      if (status) filter.status = status;

      const [items, total] = await Promise.all([
        app.collections.sharedItems
          .find(filter, { sort: { createdAt: -1 }, limit, skip })
          .toArray(),
        app.collections.sharedItems.countDocuments(filter),
      ]);

      const owner = await app.collections.users.findOne(
        { _id: new ObjectId(req.user.id) },
        { projection: { displayName: 1 } },
      );

      const enriched = await Promise.all(
        items.map(async (item) => {
          const name = await resolveResourceName(app.collections, item.resourceType, item.resourceId);
          return toSharedItem(item, name, owner?.displayName ?? '');
        }),
      );

      return { items: enriched, total };
    },
  );
};
