import type { SharedItemDoc } from '../../db/types.js';

export function toSharedItem(doc: SharedItemDoc, resourceName: string, ownerName: string) {
  return {
    id: doc._id.toString(),
    resourceType: doc.resourceType,
    resourceId: doc.resourceId.toString(),
    resourceName,
    ownerId: doc.ownerId.toString(),
    ownerName,
    friendId: doc.friendId.toString(),
    status: doc.status,
    savedAt: doc.savedAt?.toISOString() ?? null,
    savedResourceId: doc.savedResourceId?.toString() ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}
