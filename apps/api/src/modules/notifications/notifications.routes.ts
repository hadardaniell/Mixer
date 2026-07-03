import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { NotificationListQuerySchema } from '@mixer/contracts';
import type { NotificationDoc } from '../../db/types.js';

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
