import { randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { config } from '../../config.js';
import type { Collections } from '../../plugins/mongo.js';
import { signAccessToken } from '../../plugins/auth.js';
import type { UserDoc } from '../../db/types.js';
import { toPublicUser } from '../users/users.mapper.js';
import type { AuthResponse } from '@mixer/contracts';

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

export async function rotateRefreshToken(
  collections: Collections,
  refreshToken: string,
  meta: { userAgent?: string; ipAddress?: string } = {},
): Promise<AuthResponse | null> {
  const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
  const existing = await collections.refreshTokens.findOne({ tokenHash });
  if (!existing) return null;
  if (existing.revokedAt) return null;
  if (existing.expiresAt.getTime() < Date.now()) return null;

  await collections.refreshTokens.updateOne(
    { _id: existing._id },
    { $set: { revokedAt: new Date() } },
  );

  const user = await collections.users.findOne({ _id: existing.userId });
  if (!user) return null;

  return issueTokens(collections, user, meta);
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
