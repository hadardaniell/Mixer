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
  type: 'personal' | 'shared' | 'meal';
  members: RecipeBookMember[];
  recipeIds: ObjectId[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};
