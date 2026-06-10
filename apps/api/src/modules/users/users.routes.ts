// apps/api/src/modules/users/users.routes.ts
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import {
  CreateUserAsAdminInputSchema,
  UpdateOwnUserSchema,
  UpdateUserAsAdminSchema,
  UsersByIdsInputSchema,
} from '@mixer/contracts';
import { toPublicUser } from './users.mapper.js';
import { hashPassword } from '../auth/auth.service.js';

const IdParam = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/i) });
const ListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().nonnegative().default(0),
});

function isDuplicateKeyError(err: unknown, field: string): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: number; keyPattern?: Record<string, unknown> };
  return e.code === 11000 && !!e.keyPattern && field in e.keyPattern;
}

export const usersRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/users/me/avatar',
    {
      onRequest: [app.authenticate], 
    },
    async (req, reply) => {
      const data = await req.file({ limits: { fileSize: 3 * 1024 * 1024 } }); 
      
      if (!data) {
        return reply.code(400).send({ error: 'No image file sent' });
      }

      const uniqueFileName = `avatars/${req.user.id}_${Date.now()}_${data.filename}`;
      
      const file = app.firebaseBucket.file(uniqueFileName);

      const writeStream = file.createWriteStream({
        metadata: {
          contentType: data.mimetype, // (png/jpeg)
        },
        resumable: false,
      });

      try {
        await new Promise<void>((resolve, reject) => {
          data.file.pipe(writeStream)
            .on('finish', resolve)
            .on('error', (err: any) => {
              app.log.error('Avatar Write Stream Error:', err);
              reject(err);
            });
          
          data.file.on('error', (err: any) => {
            app.log.error('Avatar File Read Error:', err);
            reject(err);
          });
        });

          const encodedFilePath = encodeURIComponent(uniqueFileName);
          const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${app.firebaseBucket.name}/o/${encodedFilePath}?alt=media`;

          const updatedUser = await app.collections.users.findOneAndUpdate(
            { _id: new ObjectId(req.user.id) },
            { $set: { avatarUrl: publicUrl, updatedAt: new Date() } },
            { returnDocument: 'after' }
          );

          if (!updatedUser) {
            return reply.code(404).send({ error: 'user not found' });
          }

          return reply.code(200).send(toPublicUser(updatedUser));

        } catch (error: any) {
          app.log.error('Avatar Upload Error Details:', error);
          return reply.code(500).send({ 
            error: 'Failed to upload profile picture to Firebase storage server',
            message: error?.message || error 
          });
        }
      }
    );

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
      try {
        const updated = await app.collections.users.findOneAndUpdate(
          { _id: new ObjectId(req.user.id) },
          { $set: { ...req.body, updatedAt: new Date() } },
          { returnDocument: 'after' },
        );
        if (!updated) return reply.code(404).send({ error: 'user not found' });
        return toPublicUser(updated);
      } catch (e) {
        if (isDuplicateKeyError(e, 'phoneNumber')) {
          return reply.code(409).send({ error: 'phone_already_registered' });
        }
        throw e;
      }
    },
  );

  app.post(
    '/users/by-ids',
    {
      onRequest: [app.authenticate],
      schema: { body: UsersByIdsInputSchema, tags: ['users'] },
    },
    async (req) => {
      const oids = req.body.ids.map((id) => new ObjectId(id));
      const items = await app.collections.users.find({ _id: { $in: oids } }).toArray();
      return { items: items.map(toPublicUser) };
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

  app.post(
    '/users',
    {
      onRequest: [app.authenticate, app.requireAdmin],
      schema: { body: CreateUserAsAdminInputSchema, tags: ['users'] },
    },
    async (req, reply) => {
      const { email, displayName, locale, role, password } = req.body;
      const existing = await app.collections.users.findOne({ email });
      if (existing) return reply.code(409).send({ error: 'email already registered' });
      const now = new Date();
      const doc = {
        _id: new ObjectId(),
        email,
        passwordHash: password ? await hashPassword(password) : null,
        displayName,
        locale,
        role,
        createdAt: now,
        updatedAt: now,
      };
      await app.collections.users.insertOne(doc);
      return reply.code(201).send(toPublicUser(doc));
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
