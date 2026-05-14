import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import {
  UpdateOwnUserSchema,
  UpdateUserAsAdminSchema,
} from '@mixer/contracts';
import { toPublicUser } from './users.mapper.js';

const IdParam = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/i) });
const ListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().nonnegative().default(0),
});

export const usersRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/users/me',
    { onRequest: [app.authenticate], schema: { tags: ['users'] } },
    async (req, reply) => {
      const user = await app.collections.users.findOne({ _id: new ObjectId(req.user.id) });
      if (!user) return reply.code(404).send({ error: 'user not found' });
      return toPublicUser(user);
    },
  );

  app.patch(
    '/users/me',
    {
      onRequest: [app.authenticate],
      schema: { body: UpdateOwnUserSchema, tags: ['users'] },
    },
    async (req, reply) => {
      const updated = await app.collections.users.findOneAndUpdate(
        { _id: new ObjectId(req.user.id) },
        { $set: { ...req.body, updatedAt: new Date() } },
        { returnDocument: 'after' },
      );
      if (!updated) return reply.code(404).send({ error: 'user not found' });
      return toPublicUser(updated);
    },
  );

  app.get(
    '/users',
    {
      onRequest: [app.authenticate, app.requireAdmin],
      schema: { querystring: ListQuery, tags: ['users'] },
    },
    async (req) => {
      const { limit, skip } = req.query;
      const [items, total] = await Promise.all([
        app.collections.users.find({}, { sort: { createdAt: -1 }, limit, skip }).toArray(),
        app.collections.users.countDocuments({}),
      ]);
      return { items: items.map(toPublicUser), total };
    },
  );

  app.get(
    '/users/:id',
    {
      onRequest: [app.authenticate, app.requireAdmin],
      schema: { params: IdParam, tags: ['users'] },
    },
    async (req, reply) => {
      const user = await app.collections.users.findOne({ _id: new ObjectId(req.params.id) });
      if (!user) return reply.code(404).send({ error: 'user not found' });
      return toPublicUser(user);
    },
  );

  app.patch(
    '/users/:id',
    {
      onRequest: [app.authenticate, app.requireAdmin],
      schema: { params: IdParam, body: UpdateUserAsAdminSchema, tags: ['users'] },
    },
    async (req, reply) => {
      const updated = await app.collections.users.findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: { ...req.body, updatedAt: new Date() } },
        { returnDocument: 'after' },
      );
      if (!updated) return reply.code(404).send({ error: 'user not found' });
      return toPublicUser(updated);
    },
  );

  app.delete(
    '/users/:id',
    {
      onRequest: [app.authenticate, app.requireAdmin],
      schema: { params: IdParam, tags: ['users'] },
    },
    async (req, reply) => {
      const res = await app.collections.users.deleteOne({ _id: new ObjectId(req.params.id) });
      if (res.deletedCount === 0) return reply.code(404).send({ error: 'user not found' });
      return reply.code(204).send();
    },
  );
};
