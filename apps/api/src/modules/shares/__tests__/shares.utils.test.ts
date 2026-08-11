import { describe, expect, it } from 'vitest';
import { ObjectId } from 'mongodb';
import { toSharedItem } from '../shares.utils.js';
import type { SharedItemDoc } from '../../../db/types.js';

const OWNER_ID = new ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa');
const FRIEND_ID = new ObjectId('bbbbbbbbbbbbbbbbbbbbbbbb');
const RESOURCE_ID = new ObjectId('cccccccccccccccccccccccc');
const SHARE_ID = new ObjectId('dddddddddddddddddddddddd');
const SAVED_ID = new ObjectId('eeeeeeeeeeeeeeeeeeeeeeee');

function makeDoc(overrides: Partial<SharedItemDoc> = {}): SharedItemDoc {
  return {
    _id: SHARE_ID,
    resourceType: 'recipe',
    resourceId: RESOURCE_ID,
    ownerId: OWNER_ID,
    friendId: FRIEND_ID,
    status: 'pending',
    savedAt: null,
    savedResourceId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('toSharedItem', () => {
  it('converts all ObjectId fields to strings', () => {
    const result = toSharedItem(makeDoc(), 'Pasta', 'Alice');
    expect(result.id).toBe('dddddddddddddddddddddddd');
    expect(result.resourceId).toBe('cccccccccccccccccccccccc');
    expect(result.ownerId).toBe('aaaaaaaaaaaaaaaaaaaaaaaa');
    expect(result.friendId).toBe('bbbbbbbbbbbbbbbbbbbbbbbb');
  });

  it('converts createdAt Date to ISO string', () => {
    const result = toSharedItem(makeDoc(), 'Pasta', 'Alice');
    expect(result.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('passes resourceName and ownerName through', () => {
    const result = toSharedItem(makeDoc(), 'Family Shakshuka', 'Bob');
    expect(result.resourceName).toBe('Family Shakshuka');
    expect(result.ownerName).toBe('Bob');
  });

  it('passes resourceType and status through unchanged', () => {
    const result = toSharedItem(makeDoc({ resourceType: 'book', status: 'accepted' }), 'My Book', 'Alice');
    expect(result.resourceType).toBe('book');
    expect(result.status).toBe('accepted');
  });

  it('returns null savedAt and savedResourceId when not yet saved', () => {
    const result = toSharedItem(makeDoc(), 'Pasta', 'Alice');
    expect(result.savedAt).toBeNull();
    expect(result.savedResourceId).toBeNull();
  });

  it('converts savedAt to ISO string and savedResourceId to string when present', () => {
    const result = toSharedItem(
      makeDoc({
        status: 'accepted',
        savedAt: new Date('2026-03-15T10:00:00.000Z'),
        savedResourceId: SAVED_ID,
      }),
      'Pasta',
      'Alice',
    );
    expect(result.savedAt).toBe('2026-03-15T10:00:00.000Z');
    expect(result.savedResourceId).toBe('eeeeeeeeeeeeeeeeeeeeeeee');
  });

  it('handles rejected status', () => {
    const result = toSharedItem(makeDoc({ status: 'rejected' }), 'Hummus', 'Eve');
    expect(result.status).toBe('rejected');
  });
});
