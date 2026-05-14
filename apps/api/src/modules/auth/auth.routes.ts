import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ObjectId } from 'mongodb';
import {
  LoginInputSchema,
  RefreshInputSchema,
  RegisterInputSchema,
} from '@mixer/contracts';
import {
  hashPassword,
  issueTokens,
  revokeRefreshToken,
  rotateRefreshToken,
  verifyPassword,
} from './auth.service.js';
import { toPublicUser } from '../users/users.mapper.js';

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/auth/register',
    { schema: { body: RegisterInputSchema, tags: ['auth'] } },
    async (req, reply) => {
      const { email, password, displayName, locale } = req.body;

      const existing = await app.collections.users.findOne({ email });
      if (existing) return reply.code(409).send({ error: 'email already registered' });

      const now = new Date();
      const doc = {
        _id: new ObjectId(),
        email,
        passwordHash: await hashPassword(password),
        displayName,
        locale,
        role: 'user' as const,
        createdAt: now,
        updatedAt: now,
      };
      await app.collections.users.insertOne(doc);

      const tokens = await issueTokens(app.collections, doc, {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      });
      return reply.code(201).send(tokens);
    },
  );

  app.post(
    '/auth/login',
    { schema: { body: LoginInputSchema, tags: ['auth'] } },
    async (req, reply) => {
      const { email, password } = req.body;
      const user = await app.collections.users.findOne({ email });
      if (!user || !user.passwordHash) {
        return reply.code(401).send({ error: 'invalid credentials' });
      }
      const ok = await verifyPassword(password, user.passwordHash);
      if (!ok) return reply.code(401).send({ error: 'invalid credentials' });

      return issueTokens(app.collections, user, {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      });
    },
  );

  app.post(
    '/auth/refresh',
    { schema: { body: RefreshInputSchema, tags: ['auth'] } },
    async (req, reply) => {
      const tokens = await rotateRefreshToken(app.collections, req.body.refreshToken, {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      });
      if (!tokens) return reply.code(401).send({ error: 'invalid refresh token' });
      return tokens;
    },
  );

  app.post(
    '/auth/logout',
    { schema: { body: RefreshInputSchema, tags: ['auth'] } },
    async (req, reply) => {
      await revokeRefreshToken(app.collections, req.body.refreshToken);
      return reply.code(204).send();
    },
  );

  app.get(
    '/auth/me',
    { onRequest: [app.authenticate], schema: { tags: ['auth'] } },
    async (req, reply) => {
      const user = await app.collections.users.findOne({ _id: new ObjectId(req.user.id) });
      if (!user) return reply.code(404).send({ error: 'user not found' });
      return toPublicUser(user);
    },
  );
};
