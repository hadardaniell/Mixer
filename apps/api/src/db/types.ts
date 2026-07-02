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

export type RecipeBookMember = {
  userId: ObjectId;
  role: 'owner' | 'editor' | 'viewer';
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
  recipientId: ObjectId;
  status: 'pending' | 'accepted';
  createdAt: Date;
  acceptedAt?: Date;
};

export type UrlExtractionCacheDoc = {
  _id: ObjectId;
  url: string;
  extraction: Record<string, unknown>;
  extractedAt: Date;
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
    | 'FRIEND_UNFRIENDED';
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
  expiresAt: Date | null;
};
