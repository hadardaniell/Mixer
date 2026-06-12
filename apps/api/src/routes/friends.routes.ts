import { z } from 'zod';
import { ObjectId } from 'mongodb';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

export const friendsRoutes: FastifyPluginAsyncZod = async (app) => {
  // Helper to safely access the DB based on fastify decorators
  const getDb = (server: any) => server.db || server.mongo?.db;

  // 1. POST /request - Send a friend request
  app.post(
    '/request',
    {
      schema: {
        tags: ['Friends'],
        summary: 'Send a friend request',
        description: 'Sends a friend request to another user.',
        body: z.object({
          targetUserId: z.string().regex(/^[a-fA-F0-9]{24}$/),
        }),
        response: {
          200: z.object({ status: z.literal('pending') }),
          400: z.object({ message: z.string() }),
        },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const currentUserId = new ObjectId(request.user.id);
      const targetUserId = new ObjectId(request.body.targetUserId);
      const db = getDb(request.server);

      if (currentUserId.equals(targetUserId)) {
        return reply.code(400).send({ message: 'Cannot add yourself as a friend' });
      }

      const existing = await db.collection('friendships').findOne({
        $or: [
          { requesterId: currentUserId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: currentUserId },
        ],
      });

      if (existing) {
        return reply.code(400).send({ message: 'Friendship or request already exists' });
      }

      const participants = [currentUserId, targetUserId].sort((a, b) =>
        a.toString().localeCompare(b.toString())
      );

      await db.collection('friendships').insertOne({
        requesterId: currentUserId,
        addresseeId: targetUserId,
        participants,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { status: 'pending' as const };
    }
  );

  // 2. PUT /:id/accept - Accept a friend request
  app.put(
    '/:id/accept',
    {
      schema: {
        tags: ['Friends'],
        summary: 'Accept friend request',
        description: 'Accepts an incoming pending friend request.',
        params: z.object({
          id: z.string().regex(/^[a-fA-F0-9]{24}$/),
        }),
        response: {
          200: z.object({ status: z.literal('accepted') }),
          404: z.object({ message: z.string() }),
        },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const currentUserId = new ObjectId(request.user.id);
      const requesterId = new ObjectId(request.params.id);
      const db = getDb(request.server);

      const result = await db.collection('friendships').updateOne(
        { requesterId, addresseeId: currentUserId, status: 'pending' },
        { $set: { status: 'accepted', updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return reply.code(404).send({ message: 'Pending request not found' });
      }

      // TODO: WebSocket / Push Notification logic could go here to notify the requester!

      return { status: 'accepted' as const };
    }
  );

  // 3. DELETE /request/:id - Reject or cancel a request silently
  app.delete(
    '/request/:id',
    {
      schema: {
        tags: ['Friends'],
        summary: 'Reject or cancel friend request',
        description: 'Deletes a pending incoming or outgoing request.',
        params: z.object({
          id: z.string().regex(/^[a-fA-F0-9]{24}$/),
        }),
        response: {
          200: z.object({ status: z.literal('deleted') }),
          404: z.object({ message: z.string() }),
        },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const currentUserId = new ObjectId(request.user.id);
      const targetId = new ObjectId(request.params.id);
      const db = getDb(request.server);

      const result = await db.collection('friendships').deleteOne({
        $or: [
          { requesterId: targetId, addresseeId: currentUserId, status: 'pending' },
          { requesterId: currentUserId, addresseeId: targetId, status: 'pending' },
        ],
      });

      if (result.deletedCount === 0) {
        return reply.code(404).send({ message: 'Pending request not found' });
      }

      return { status: 'deleted' as const };
    }
  );

  // 4. GET / - List accepted friends
  app.get(
    '/',
    {
      schema: {
        tags: ['Friends'],
        summary: 'List accepted friends',
        response: {
          200: z.object({
            friends: z.array(
              z.object({
                id: z.string(),
                displayName: z.string().optional(),
                avatarUrl: z.string().nullable().optional(),
              })
            ),
          }),
        },
      },
      onRequest: [app.authenticate],
    },
    async (request) => {
      const currentUserId = new ObjectId(request.user.id);
      const db = getDb(request.server);

      const friendships = await db.collection('friendships').find({
        participants: currentUserId,
        status: 'accepted',
      }).toArray();

      const friendIds = friendships.map((f: any) =>
        f.requesterId.equals(currentUserId) ? f.addresseeId : f.requesterId
      );

      if (friendIds.length === 0) return { friends: [] };

      const users = await db.collection('users').find(
        { _id: { $in: friendIds } },
        { projection: { displayName: 1, avatarUrl: 1 } }
      ).toArray();

      return {
        friends: users.map((u: any) => ({
          id: u._id.toString(),
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
        })),
      };
    }
  );

  // 5. GET /requests - Incoming pending requests
  app.get(
    '/requests',
    {
      schema: {
        tags: ['Friends'],
        summary: 'List incoming requests',
        response: {
          200: z.object({
            requests: z.array(
              z.object({
                id: z.string(),
                requester: z.object({
                  id: z.string(),
                  displayName: z.string().optional(),
                  avatarUrl: z.string().nullable().optional(),
                }),
                createdAt: z.string(),
              })
            ),
          }),
        },
      },
      onRequest: [app.authenticate],
    },
    async (request) => {
      const currentUserId = new ObjectId(request.user.id);
      const db = getDb(request.server);

      const requests = await db.collection('friendships').find({
        addresseeId: currentUserId,
        status: 'pending',
      }).toArray();

      if (requests.length === 0) return { requests: [] };

      const requesterIds = requests.map((r: any) => r.requesterId);
      const requesters = await db.collection('users').find(
        { _id: { $in: requesterIds } },
        { projection: { displayName: 1, avatarUrl: 1 } }
      ).toArray();

      return {
        requests: requests.map((r: any) => {
          const u = requesters.find((reqU: any) => reqU._id.equals(r.requesterId));
          return {
            id: r._id.toString(),
            requester: {
              id: u?._id.toString() || r.requesterId.toString(),
              displayName: u?.displayName,
              avatarUrl: u?.avatarUrl,
            },
            createdAt: r.createdAt.toISOString(),
          };
        }),
      };
    }
  );

  // 6. DELETE /:id - Unfriend + auto-fork
  app.delete(
    '/:id',
    {
      schema: {
        tags: ['Friends'],
        summary: 'Unfriend a user',
        description: 'Removes friend and auto-forks their live-link recipes you have favorited.',
        params: z.object({
          id: z.string().regex(/^[a-fA-F0-9]{24}$/),
        }),
        response: {
          200: z.object({
            status: z.literal('unfriended'),
            forkedCount: z.number(),
          }),
          404: z.object({ message: z.string() }),
        },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const currentUserId = new ObjectId(request.user.id);
      const friendId = new ObjectId(request.params.id);
      const db = getDb(request.server);

      const participants = [currentUserId, friendId].sort((a, b) =>
        a.toString().localeCompare(b.toString())
      );

      const result = await db.collection('friendships').deleteOne({
        participants,
        status: 'accepted',
      });

      if (result.deletedCount === 0) {
        return reply.code(404).send({ message: 'Friendship not found' });
      }

      // Auto-fork live-link shares you favored
      const myFavorites = await db.collection('favorites').find({
        userId: currentUserId,
      }).toArray();

      // Fallback depending on your DB schema (`targetId` or `recipeId`)
      const favoritedRecipeIds = myFavorites
        .filter((f: any) => !f.kind || f.kind === 'recipe')
        .map((f: any) => f.targetId || f.recipeId)
        .filter(Boolean);

      let forkedCount = 0;

      if (favoritedRecipeIds.length > 0) {
        const recipesToFork = await db.collection('recipes').find({
          _id: { $in: favoritedRecipeIds },
          ownerId: friendId,
        }).toArray();

        for (const recipe of recipesToFork) {
          const newRecipeId = new ObjectId();
          const newRecipe = {
            ...recipe,
            _id: newRecipeId,
            ownerId: currentUserId,
            forkedFrom: recipe._id,
            forkedAt: new Date(),
            visibility: 'private',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await db.collection('recipes').insertOne(newRecipe);

          // Point your favorite directly to the newly cloned private recipe
          const favoriteEntry = myFavorites.find(
            (f: any) => f.targetId?.equals(recipe._id) || f.recipeId?.equals(recipe._id)
          );

          if (favoriteEntry) {
            await db.collection('favorites').updateOne(
              { _id: favoriteEntry._id },
              { $set: { targetId: newRecipeId, recipeId: newRecipeId } }
            );
          }
          forkedCount++;
        }
      }

      return { status: 'unfriended' as const, forkedCount };
    }
  );
};