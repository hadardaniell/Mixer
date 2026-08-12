import { describe, expect, it } from 'vitest';
import { ObjectId } from 'mongodb';
import { memberRole } from '../recipe-books.utils.js';
import type { RecipeBookDoc } from '../../../db/types.js';

const OWNER_ID = new ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa');
const EDITOR_ID = new ObjectId('bbbbbbbbbbbbbbbbbbbbbbbb');
const VIEWER_ID = new ObjectId('cccccccccccccccccccccccc');
const STRANGER_ID = new ObjectId('dddddddddddddddddddddddd');
const PENDING_ID = new ObjectId('eeeeeeeeeeeeeeeeeeeeeeee');

const now = new Date('2026-01-01T00:00:00.000Z');

const book: RecipeBookDoc = {
  _id: new ObjectId('ffffffffffffffffffffffff'),
  ownerId: OWNER_ID,
  name: 'Family Recipes',
  type: 'personal',
  language: 'he',
  members: [
    { userId: OWNER_ID, role: 'owner', addedAt: now },
    { userId: EDITOR_ID, role: 'editor', addedAt: now },
    { userId: VIEWER_ID, role: 'viewer', addedAt: now },
    { userId: PENDING_ID, role: 'editor', status: 'pending', addedAt: now },
  ],
  recipeIds: [],
  tags: [],
  createdAt: now,
  updatedAt: now,
};

describe('memberRole', () => {
  it('returns "owner" for the book owner', () => {
    expect(memberRole(book, OWNER_ID.toString())).toBe('owner');
  });

  it('returns "editor" for an editor member', () => {
    expect(memberRole(book, EDITOR_ID.toString())).toBe('editor');
  });

  it('returns "viewer" for a viewer member', () => {
    expect(memberRole(book, VIEWER_ID.toString())).toBe('viewer');
  });

  it('returns null for a user who is not a member', () => {
    expect(memberRole(book, STRANGER_ID.toString())).toBeNull();
  });

  it('returns null for an empty string userId', () => {
    expect(memberRole(book, '')).toBeNull();
  });

  it('returns "owner" even when the owner is also in the members array', () => {
    // owner check runs before member lookup — owner always wins
    expect(memberRole(book, OWNER_ID.toString())).toBe('owner');
  });

  it('returns null for a pending (not yet accepted) member', () => {
    expect(memberRole(book, PENDING_ID.toString())).toBeNull();
  });
});
