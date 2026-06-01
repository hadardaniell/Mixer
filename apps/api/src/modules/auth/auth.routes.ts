import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ObjectId } from 'mongodb';
import {
  GoogleLoginInputSchema,
  LoginInputSchema,
  RefreshInputSchema,
  RegisterInputSchema,
} from '@mixer/contracts';
import { config } from '../../config.js';
import {
  findOrCreateGoogleUser,
  GoogleLinkRequiresPasswordError,
  hashPassword,
  issueTokens,
  revokeRefreshToken,
  rotateRefreshToken,
  verifyGoogleIdToken,
  verifyPassword,
} from './auth.service.js';
import { toPublicUser } from '../users/users.mapper.js';

function isDuplicateKeyError(err: unknown, field: string): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: number; keyPattern?: Record<string, unknown> };
  return e.code === 11000 && !!e.keyPattern && field in e.keyPattern;
}

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/auth/register',
    { schema: { body: RegisterInputSchema, tags: ['auth'] } },
    async (req, reply) => {
      const { password, displayName, locale, phoneNumber } = req.body;
      const email = req.body.email.toLowerCase();
      const phone = phoneNumber.trim();

      // Pre-check both unique fields so we can return a specific code per cause.
      const existingEmail = await app.collections.users.findOne({ email });
      if (existingEmail) return reply.code(409).send({ error: 'email_already_registered' });
      const existingPhone = await app.collections.users.findOne({ phoneNumber: phone });
      if (existingPhone) return reply.code(409).send({ error: 'phone_already_registered' });

      const now = new Date();
      const doc = {
        _id: new ObjectId(),
        email,
        phoneNumber: phone,
        passwordHash: await hashPassword(password),
        displayName,
        locale,
        role: 'user' as const,
        createdAt: now,
        updatedAt: now,
      };
      try {
        await app.collections.users.insertOne(doc);
      } catch (e) {
        // Race condition fallback: the unique index caught what the pre-check
        // missed (two concurrent registrations with the same email/phone).
        if (isDuplicateKeyError(e, 'email')) {
          return reply.code(409).send({ error: 'email_already_registered' });
        }
        if (isDuplicateKeyError(e, 'phoneNumber')) {
          return reply.code(409).send({ error: 'phone_already_registered' });
        }
        throw e;
      }

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
      const { password, email, phoneNumber } = req.body;
      // LoginInputSchema's .refine enforces exactly one identifier.
      const query = email
        ? { email: email.toLowerCase() }
        : { phoneNumber: phoneNumber!.trim() };
      const user = await app.collections.users.findOne(query);
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
    '/auth/google',
    { schema: { body: GoogleLoginInputSchema, tags: ['auth'] } },
    async (req, reply) => {
      if (!config.googleClientId) {
        return reply.code(503).send({ error: 'google sign-in not configured' });
      }
      let profile;
      try {
        profile = await verifyGoogleIdToken(req.body.idToken);
      } catch {
        return reply.code(401).send({ error: 'invalid Google id token' });
      }
      let user;
      try {
        user = await findOrCreateGoogleUser(app.collections, profile);
      } catch (e) {
        if (e instanceof GoogleLinkRequiresPasswordError) {
          return reply.code(409).send({ error: 'link_requires_password' });
        }
        throw e;
      }
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
