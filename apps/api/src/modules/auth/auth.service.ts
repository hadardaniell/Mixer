import { randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../../config.js';
import type { Collections } from '../../plugins/mongo.js';
import { signAccessToken } from '../../plugins/auth.js';
import type { UserDoc } from '../../db/types.js';
import { toPublicUser } from '../users/users.mapper.js';
import type { AuthResponse } from '@mixer/contracts';

const googleClient = new OAuth2Client(config.googleClientId);

export type GoogleProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
};

export class GoogleLinkRequiresPasswordError extends Error {
  constructor() {
    super('link_requires_password');
    this.name = 'GoogleLinkRequiresPasswordError';
  }
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: config.googleClientId,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new Error('invalid Google id token');
  }
  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified === true,
    name: payload.name,
    picture: payload.picture,
  };
}

export async function findOrCreateGoogleUser(
  collections: Collections,
  profile: GoogleProfile,
): Promise<UserDoc> {
  const bySub = await collections.users.findOne({ 'providers.google.sub': profile.sub });
  if (bySub) return bySub;

  const byEmail = await collections.users.findOne({ email: profile.email });
  if (byEmail) {
    if (!profile.emailVerified) {
      throw new GoogleLinkRequiresPasswordError();
    }
    const now = new Date();
    await collections.users.updateOne(
      { _id: byEmail._id },
      {
        $set: {
          'providers.google': { sub: profile.sub, email: profile.email, linkedAt: now },
          emailVerifiedAt: byEmail.emailVerifiedAt ?? now,
          updatedAt: now,
        },
      },
    );
    return (await collections.users.findOne({ _id: byEmail._id }))!;
  }

  const now = new Date();
  const doc: UserDoc = {
    _id: new ObjectId(),
    email: profile.email,
    passwordHash: null,
    displayName: profile.name ?? profile.email.split('@')[0]!,
    avatarUrl: profile.picture,
    locale: 'en',
    role: 'user',
    providers: { google: { sub: profile.sub, email: profile.email, linkedAt: now } },
    emailVerifiedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  await collections.users.insertOne(doc);
  return doc;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, config.bcryptCost);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function newRefreshToken(): { token: string; tokenHash: string } {
  const token = randomBytes(48).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
}

export async function issueTokens(
  collections: Collections,
  user: UserDoc,
  meta: { userAgent?: string; ipAddress?: string } = {},
): Promise<AuthResponse> {
  const accessToken = signAccessToken({ id: user._id.toString(), role: user.role });
  const { token, tokenHash } = newRefreshToken();

  await collections.refreshTokens.insertOne({
    _id: new ObjectId(),
    userId: user._id,
    tokenHash,
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
    expiresAt: new Date(Date.now() + config.refreshTtlSeconds * 1000),
    createdAt: new Date(),
  });

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken: token,
  };
}

/**
 * Refresh the access token without rotating the refresh token. The same refresh
 * token stays valid (we only slide its expiry) so concurrent requests, multiple
 * devices, and app reloads can't invalidate each other and log the user out.
 * The refresh token is still revocable on logout and expires after the TTL of
 * inactivity.
 */
export async function refreshSession(
  collections: Collections,
  refreshToken: string,
): Promise<AuthResponse | null> {
  const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
  const existing = await collections.refreshTokens.findOne({ tokenHash });
  if (!existing) return null;
  if (existing.revokedAt) return null;
  if (existing.expiresAt.getTime() < Date.now()) return null;

  const user = await collections.users.findOne({ _id: existing.userId });
  if (!user) return null;

  // Sliding expiry — keep active sessions alive.
  await collections.refreshTokens.updateOne(
    { _id: existing._id },
    { $set: { expiresAt: new Date(Date.now() + config.refreshTtlSeconds * 1000) } },
  );

  const accessToken = signAccessToken({ id: user._id.toString(), role: user.role });
  return { user: toPublicUser(user), accessToken, refreshToken };
}

export async function revokeRefreshToken(
  collections: Collections,
  refreshToken: string,
): Promise<boolean> {
  const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
  const res = await collections.refreshTokens.updateOne(
    { tokenHash, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } },
  );
  return res.modifiedCount > 0;
}
