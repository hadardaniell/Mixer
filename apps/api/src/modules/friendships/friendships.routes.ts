import { z } from 'zod';
import { ObjectId } from 'mongodb';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import * as friendshipsService from './friendships.service.js';

export const friendsRoutes: FastifyPluginAsyncZod = async (app) => {
  // Helper to safely access the DB based on fastify decorators
  const getDb = (server: any) => server.db || server.mongo?.db;

  // 1. POST /sync-contacts - Sync contacts
  app.post(
    '/sync-contacts',
    {
      schema: {
        tags: ['Friends'],
        summary: 'Sync contacts',
        description: 'Returns matching registered users from a list of phone numbers.',
        body: z.object({
          contacts: z.array(z.string()),
        }),
        response: {
          200: z.object({
            users: z.array(
              z.object({
                id: z.string(),
                displayName: z.string().optional(),
                phoneNumber: z.string().optional(),
                avatarUrl: z.string().nullable().optional(),
                friendshipStatus: z.string(),
                isRequester: z.boolean(),
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

      return friendshipsService.syncContacts(db, currentUserId, request.body.contacts);
    }
  );

  // 2. POST /request - Send a friend request
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

      const result = await friendshipsService.sendFriendRequest(db, currentUserId, targetUserId);
      
      if ('error' in result) {
        return reply.code(result.code).send({ message: result.error });
      }
      return { status: result.status as 'pending' };
    }
  );

  // 3. PUT /:id/accept - Accept a friend request
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

      const result = await friendshipsService.acceptFriendRequest(db, currentUserId, requesterId);
      
      // TODO: Call push notification service here!

      if ('error' in result) {
        return reply.code(result.code).send({ message: result.error });
      }
      return { status: result.status as 'accepted' };
    }
  );

  // 4. DELETE /request/:id - Reject or cancel a request silently
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

      const result = await friendshipsService.rejectOrCancelFriendRequest(db, currentUserId, targetId);

      if ('error' in result) {
        return reply.code(result.code).send({ message: result.error });
      }
      return { status: result.status as 'deleted' };
    }
  );

  // 5. GET / - List accepted friends
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

      return friendshipsService.getAcceptedFriends(db, currentUserId);
    }
  );

  // 6. GET /requests - Incoming pending requests
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

      return friendshipsService.getIncomingRequests(db, currentUserId);
    }
  );

  // 7. DELETE /:id - Unfriend + auto-fork
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

      const result = await friendshipsService.unfriendUser(db, currentUserId, friendId);

      if ('error' in result) {
        return reply.code(result.code).send({ message: result.error });
      }
      return { status: result.status as 'unfriended', forkedCount: result.forkedCount! };
    }
  );
};