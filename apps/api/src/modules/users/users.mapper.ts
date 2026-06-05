// apps/api/src/modules/users/users.mapper.ts
import type { PublicUser } from '@mixer/contracts';
import type { UserDoc } from '../../db/types.js';

export function toPublicUser(doc: UserDoc): PublicUser {
  return {
    id: doc._id.toString(),
    email: doc.email,
    displayName: doc.displayName,
    phoneNumber: doc.phoneNumber,
    avatarUrl: doc.avatarUrl,
    locale: doc.locale,
    role: doc.role,
    emailVerifiedAt: doc.emailVerifiedAt?.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
