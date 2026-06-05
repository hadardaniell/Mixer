import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const UserIdSchema = z.object({ userId: z.string().regex(/^[a-f0-9]{24}$/i) });
const IdParamSchema = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/i) });

export const friendsRoutes: FastifyPluginAsyncZod = async (app) => {
  // 1. Send a friend request
  app.post(
    '/friends/request',
    {
      onRequest: [app.authenticate],
      schema: { body: UserIdSchema, tags: ['friends'] },
    },
    async (req, reply) => {
      const requesterId = new ObjectId(req.user.id);
      const recipientId = new ObjectId(req.body.userId);

      if (requesterId.equals(recipientId)) {
        return reply.code(400).send({ error: 'Cannot add yourself as a friend' });
      }

      // Check if user exists
      const recipient = await app.collections.users.findOne({ _id: recipientId });
      if (!recipient) return reply.code(404).send({ error: 'User not found' });

      // Check if connection already exists in either direction
      const existing = await app.collections.friends.findOne({
        $or: [
          { requesterId, recipientId },
          { requesterId: recipientId, recipientId: requesterId },
        ],
      });

      if (existing) {
        return reply.code(400).send({ error: 'Friend request already exists or you are already friends' });
      }

      const now = new Date();
      const doc = {
        _id: new ObjectId(),
        requesterId,
        recipientId,
        status: 'pending' as const,
        createdAt: now,
        updatedAt: now,
      };

      await app.collections.friends.insertOne(doc as any);
      return reply.code(201).send(doc);
    },
  );

  // 2. Accept a friend request
  app.post(
    '/friends/:id/accept',
    {
      onRequest: [app.authenticate],
      schema: { params: IdParamSchema, tags: ['friends'] },
    },
    async (req, reply) => {
      const connectionId = new ObjectId(req.params.id);
      const currentUserId = new ObjectId(req.user.id);

      const connection = await app.collections.friends.findOne({ _id: connectionId });
      if (!connection) return reply.code(404).send({ error: 'Friend request not found' });

      if (!connection.recipientId.equals(currentUserId)) {
        return reply.code(403).send({ error: 'Not authorized to accept this request' });
      }

      await app.collections.friends.updateOne(
        { _id: connectionId },
        { $set: { status: 'accepted', updatedAt: new Date() } },
      );

      return reply.code(200).send({ success: true });
    },
  );

  // 3. Reject a request / Remove a friend
  app.delete(
    '/friends/:id',
    {
      onRequest: [app.authenticate],
      schema: { params: IdParamSchema, tags: ['friends'] },
    },
    async (req, reply) => {
      const connectionId = new ObjectId(req.params.id);
      const currentUserId = new ObjectId(req.user.id);

      const connection = await app.collections.friends.findOne({ _id: connectionId });
      if (!connection) return reply.code(404).send({ error: 'Friend connection not found' });

      if (!connection.requesterId.equals(currentUserId) && !connection.recipientId.equals(currentUserId)) {
        return reply.code(403).send({ error: 'Not authorized to remove this connection' });
      }

      await app.collections.friends.deleteOne({ _id: connectionId });
      return reply.code(204).send();
    },
  );

  // 4. List all accepted friends
  app.get(
    '/friends',
    {
      onRequest: [app.authenticate],
      schema: { tags: ['friends'] },
    },
    async (req) => {
      const currentUserId = new ObjectId(req.user.id);

      const connections = await app.collections.friends.find({
        $or: [{ requesterId: currentUserId }, { recipientId: currentUserId }],
        status: 'accepted',
      }).toArray();

      const friendIds = connections.map((c: any) =>
        c.requesterId.equals(currentUserId) ? c.recipientId : c.requesterId,
      );

      if (friendIds.length === 0) return [];

      const friends = await app.collections.users.find(
        { _id: { $in: friendIds } },
        { projection: { passwordHash: 0, providers: 0 } }, // Keep passwords hidden!
      ).toArray();

      return friends.map((f: any) => ({
        id: f._id.toString(),
        displayName: f.displayName,
        avatarUrl: f.avatarUrl,
      }));
    },
  );
};
