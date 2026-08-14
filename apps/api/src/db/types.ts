//apps/api/src/db/types.ts
import type { ObjectId } from 'mongodb';

export type UserDoc = {
  _id: ObjectId;
  email: string;
  passwordHash: string | null;
  displayName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  locale: 'he' | 'en';
  role: 'user' | 'admin';
  providers?: {
    google?: { sub: string; email: string; linkedAt: Date };
  };
  emailVerifiedAt?: Date;
  expoPushToken?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

// export type FriendshipDoc = {
//   _id: ObjectId;
//   requesterId: ObjectId;
//   addresseeId: ObjectId;
//   status: FriendshipStatus;
//   participants: [ObjectId, ObjectId];
//   createdAt: Date;
//   updatedAt: Date;
// };

export type RefreshTokenDoc = {
  _id: ObjectId;
  userId: ObjectId;
  tokenHash: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
};

export type RecipeIngredient = {
  name: string;
  amount?: number;
  unit?: string;
  note?: string;
};

export type RecipeStep = {
  order: number;
  text: string;
  durationMinutes?: number;
};

export type RecipeDoc = {
  _id: ObjectId;
  ownerId: ObjectId;
  title: string;
  description?: string;
  coverImageUrl?: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  cuisine?: string;
  tags: string[];
  /** References into the `categories` collection. Optional: legacy docs predate it. */
  categoryIds?: ObjectId[];
  language: 'he' | 'en';
  source: {
    type: 'manual' | 'url' | 'image' | 'video-upload' | 'text';
    url?: string;
    platform?: 'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'web';
    importTaskId?: ObjectId;
  };
  visibility: 'private' | 'unlisted' | 'public';
  status: 'draft' | 'published';
  forkedFrom?: ObjectId;
  forkedAt?: Date;
  embedding?: number[];
  embeddingIndexedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

// Keep in sync with categoriesValidator in db/validators/categories.ts.
export type CategoryDoc = {
  _id: ObjectId;
  slug: string;
  label: { he: string; en: string };
  /** Design-system color token name, e.g. "accentPeach". */
  accent: string;
  order: number;
  isActive: boolean;
};

export type RecipeBookMember = {
  userId: ObjectId;
  role: 'owner' | 'editor' | 'viewer';
  status?: 'pending' | 'active';
  addedAt: Date;
  invitedBy?: ObjectId;
};

export type FavoriteDoc = {
  _id: ObjectId;
  userId: ObjectId;
  kind: 'recipe' | 'book';
  targetId: ObjectId;
  createdAt: Date;
};

export type RecipeBookDoc = {
  _id: ObjectId;
  ownerId: ObjectId;
  name: string;
  description?: string;
  coverImageUrl?: string;
  coverKey?: string;
  type: 'personal' | 'shared' | 'meal';
  /**
   * The catch-all book created for every account at registration ("המתכונים שלי"),
   * which recipes are filed into automatically. It's plumbing, not something the
   * user curates, so `GET /recipe-books` leaves it out of the lists they browse.
   * Books a user creates never carry this, even when their type is 'personal'.
   */
  system?: boolean;
  language: 'he' | 'en';
  members: RecipeBookMember[];
  recipeIds: ObjectId[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type SharedItemDoc = {
  _id: ObjectId;
  resourceType: 'recipe' | 'book';
  resourceId: ObjectId;
  ownerId: ObjectId;
  friendId: ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  savedAt: Date | null;
  savedResourceId: ObjectId | null;
  createdAt: Date;
};

export type FriendshipDoc = {
  _id: ObjectId;
  requesterId: ObjectId;
  addresseeId: ObjectId;
  /** Both participant ids, sorted by their string form — used for pair lookups. */
  participants: ObjectId[];
  status: 'pending' | 'accepted';
  createdAt: Date;
  updatedAt: Date;
};

export type UrlExtractionCacheDoc = {
  _id: ObjectId;
  url: string;
  locale?: string;
  extraction: Record<string, unknown>;
  extractedAt: Date;
};

/**
 * A generated cover image, keyed by the dish it depicts rather than by recipe.
 *
 * Generating an image costs real money and several seconds, and many recipes are
 * the same dish ("pasta rosa" imported by twenty people). Each generated image
 * is filed here under a canonical English dish name, and later recipes that
 * resolve to the same dish — by exact key, or by embedding similarity for
 * near-misses like "tomato beef meatballs" vs "beef meatballs tomato" — reuse it
 * instead of generating again.
 */
export type CoverImageDoc = {
  _id: ObjectId;
  /** Slugified canonical dish name, e.g. "pasta-rosa". Unique. */
  dishKey: string;
  /** The canonical dish name as the AI phrased it, e.g. "Pasta rosa". */
  label: string;
  /** Public URL of the stored image, shared by every recipe that reuses it. */
  imageUrl: string;
  /** Embedding of `label`, for matching dishes whose keys don't match exactly. */
  embedding?: number[];
  /** How many recipes have been served this image. */
  usageCount: number;
  createdAt: Date;
  lastUsedAt: Date;
};

export type PushTokenDoc = {
  _id: ObjectId;
  userId: ObjectId;
  token: string;
  deviceId: string;
  platform: 'ios' | 'android';
  createdAt: Date;
  lastSeenAt: Date;
};

export type NotificationDoc = {
  _id: ObjectId;
  userId: ObjectId;
  type:
    | 'SHARE_REQUEST'
    | 'SHARE_ACCEPTED'
    | 'SHARE_REJECTED'
    | 'OWNER_DELETED_RESOURCE'
    | 'FRIEND_REQUEST'
    | 'FRIEND_ACCEPTED'
    | 'FRIEND_UNFRIENDED'
    | 'BOOK_INVITE'
    | 'BOOK_INVITE_ACCEPTED'
    | 'BOOK_INVITE_REJECTED';
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
  expiresAt: Date | null;
};

export type RecipeTranslationDoc = {
  _id: ObjectId;
  recipeId: ObjectId;
  language: 'he' | 'en';
  title: string;
  description?: string;
  tags?: string[];
  cuisine?: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  createdAt: Date;

};
