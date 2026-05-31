import { createHmac, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';
import { config } from '../config.js';

export type AuthUser = {
  id: string;
  role: 'user' | 'admin';
};

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser;
  }
  interface FastifyInstance {
    authenticate: (req: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => Promise<void>;
    requireAdmin: (req: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => Promise<void>;
  }
}

type AccessTokenPayload = {
  sub: string;
  role: 'user' | 'admin';
  exp: number;
};

function encodeBase64Url(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sign(value: string): string {
  return createHmac('sha256', config.jwtSecret).update(value).digest('base64url');
}

function decodeBase64UrlJson<T>(value: string): T {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
}

export function signAccessToken(user: AuthUser): string {
  const header = encodeBase64Url({ alg: 'HS256', typ: 'JWT' });
  const payload = encodeBase64Url({
    sub: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + config.accessTtlSeconds,
  } satisfies AccessTokenPayload);
  const unsignedToken = `${header}.${payload}`;
  return `${unsignedToken}.${sign(unsignedToken)}`;
}

function verifyAccessToken(token: string): AccessTokenPayload {
  const [headerPart, payloadPart, signature] = token.split('.');
  if (!headerPart || !payloadPart || !signature) {
    throw new Error('malformed token');
  }

  const header = decodeBase64UrlJson<{ alg?: string; typ?: string }>(headerPart);
  if (header.alg !== 'HS256') {
    throw new Error('unsupported token algorithm');
  }

  const expectedSignature = sign(`${headerPart}.${payloadPart}`);
  const actual = Buffer.from(signature, 'base64url');
  const expected = Buffer.from(expectedSignature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error('invalid token signature');
  }

  const payload = decodeBase64UrlJson<AccessTokenPayload>(payloadPart);
  if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('expired token');
  }
  return payload;
}

export async function authPlugin(app: FastifyInstance): Promise<void> {
  app.decorate('authenticate', async (req, reply) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'missing bearer token' });
    }
    const token = header.slice('Bearer '.length).trim();
    try {
      const payload = verifyAccessToken(token);
      if (!ObjectId.isValid(payload.sub)) {
        return reply.code(401).send({ error: 'invalid token subject' });
      }
      req.user = { id: payload.sub, role: payload.role };
    } catch {
      return reply.code(401).send({ error: 'invalid or expired token' });
    }
  });

  app.decorate('requireAdmin', async (req, reply) => {
    if (req.user?.role !== 'admin') {
      return reply.code(403).send({ error: 'admin only' });
    }
  });
}
