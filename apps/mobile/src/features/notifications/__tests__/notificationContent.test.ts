import { describe, expect, it, vi } from 'vitest';
import type { TFunction } from 'i18next';
import type { Notification } from '@mixer/contracts';

vi.mock('lucide-react-native', () => ({
  Bookmark: 'Bookmark',
  BookCheck: 'BookCheck',
  BookX: 'BookX',
  Check: 'Check',
  Share2: 'Share2',
  UserMinus: 'UserMinus',
  UserPlus: 'UserPlus',
  Users: 'Users',
  X: 'X',
}));

import { getNotificationContent } from '../lib/notificationContent.js';

const t = ((key: string) => key) as unknown as TFunction;

const BASE = {
  id: 'aabbccddeeff001122334455' as const,
  read: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  expiresAt: null,
};

const ID = {
  user: 'aabbccddeeff001122334455',
  resource: 'aabbccddeeff001122334456',
  share: 'aabbccddeeff001122334457',
  savedCopy: 'aabbccddeeff001122334460',
  friendship: 'aabbccddeeff001122334461',
  book: 'aabbccddeeff001122334462',
} as const;

describe('getNotificationContent', () => {
  it('SHARE_REQUEST — Share2 icon, info color, share action, no route or avatar', () => {
    const n: Notification = {
      ...BASE,
      type: 'SHARE_REQUEST',
      payload: {
        fromUserId: ID.user,
        fromUserName: 'Alice',
        resourceType: 'recipe',
        resourceId: ID.resource,
        resourceName: 'Pasta',
        shareId: ID.share,
      },
    };
    const result = getNotificationContent(n, t);
    expect(result.Icon).toBe('Share2');
    expect(result.color).toBe('info');
    expect(result.action).toEqual({ kind: 'share', shareId: ID.share });
    expect(result.route).toBeUndefined();
    expect(result.avatar).toBeUndefined();
  });

  it('SHARE_ACCEPTED — Check icon, success color, recipe route, no action', () => {
    const n: Notification = {
      ...BASE,
      type: 'SHARE_ACCEPTED',
      payload: {
        fromUserId: ID.user,
        fromUserName: 'Bob',
        resourceType: 'recipe',
        resourceId: ID.resource,
        resourceName: 'Shakshuka',
      },
    };
    const result = getNotificationContent(n, t);
    expect(result.Icon).toBe('Check');
    expect(result.color).toBe('success');
    expect(result.route).toBe(`/recipes/${ID.resource}`);
    expect(result.action).toBeUndefined();
  });

  it('SHARE_ACCEPTED with book resourceType — generates /books/ route', () => {
    const n: Notification = {
      ...BASE,
      type: 'SHARE_ACCEPTED',
      payload: {
        fromUserId: ID.user,
        fromUserName: 'Bob',
        resourceType: 'book',
        resourceId: ID.book,
        resourceName: 'My Book',
      },
    };
    expect(getNotificationContent(n, t).route).toBe(`/books/${ID.book}`);
  });

  it('SHARE_REJECTED — X icon, warning color, route to resource', () => {
    const n: Notification = {
      ...BASE,
      type: 'SHARE_REJECTED',
      payload: {
        fromUserId: ID.user,
        fromUserName: 'Eve',
        resourceType: 'recipe',
        resourceId: ID.resource,
        resourceName: 'Hummus',
      },
    };
    const result = getNotificationContent(n, t);
    expect(result.Icon).toBe('X');
    expect(result.color).toBe('warning');
    expect(result.route).toBe(`/recipes/${ID.resource}`);
    expect(result.action).toBeUndefined();
  });

  it('OWNER_DELETED_RESOURCE — Bookmark icon, danger color, route points to savedCopyId', () => {
    const n: Notification = {
      ...BASE,
      type: 'OWNER_DELETED_RESOURCE',
      payload: {
        fromUserId: ID.user,
        fromUserName: 'Dani',
        resourceType: 'recipe',
        resourceName: 'Cholent',
        savedCopyId: ID.savedCopy,
      },
    };
    const result = getNotificationContent(n, t);
    expect(result.Icon).toBe('Bookmark');
    expect(result.color).toBe('danger');
    expect(result.route).toBe(`/recipes/${ID.savedCopy}`);
    expect(result.action).toBeUndefined();
  });

  it('FRIEND_REQUEST — UserPlus icon, friend action with fromUserId, avatar with url and name', () => {
    const n: Notification = {
      ...BASE,
      type: 'FRIEND_REQUEST',
      payload: {
        fromUserId: ID.user,
        fromUserName: 'Sara',
        fromUserAvatar: 'https://example.com/avatar.jpg',
        friendshipId: ID.friendship,
      },
    };
    const result = getNotificationContent(n, t);
    expect(result.Icon).toBe('UserPlus');
    expect(result.color).toBe('textMuted');
    expect(result.action).toEqual({ kind: 'friend', fromUserId: ID.user });
    expect(result.avatar).toEqual({ url: 'https://example.com/avatar.jpg', name: 'Sara' });
    expect(result.route).toBeUndefined();
  });

  it('FRIEND_REQUEST with null avatar — avatar.url is null', () => {
    const n: Notification = {
      ...BASE,
      type: 'FRIEND_REQUEST',
      payload: {
        fromUserId: ID.user,
        fromUserName: 'Tom',
        fromUserAvatar: null,
        friendshipId: ID.friendship,
      },
    };
    const result = getNotificationContent(n, t);
    expect(result.avatar?.url).toBeNull();
    expect(result.avatar?.name).toBe('Tom');
  });

  it('FRIEND_ACCEPTED — Users icon, avatar present, no action or route', () => {
    const n: Notification = {
      ...BASE,
      type: 'FRIEND_ACCEPTED',
      payload: {
        fromUserId: ID.user,
        fromUserName: 'Yoav',
        fromUserAvatar: null,
      },
    };
    const result = getNotificationContent(n, t);
    expect(result.Icon).toBe('Users');
    expect(result.color).toBe('textMuted');
    expect(result.avatar?.name).toBe('Yoav');
    expect(result.action).toBeUndefined();
    expect(result.route).toBeUndefined();
  });

  it('FRIEND_UNFRIENDED — UserMinus icon, avatar with name', () => {
    const n: Notification = {
      ...BASE,
      type: 'FRIEND_UNFRIENDED',
      payload: {
        fromUserId: ID.user,
        fromUserName: 'Lior',
        fromUserAvatar: 'https://example.com/lior.jpg',
      },
    };
    const result = getNotificationContent(n, t);
    expect(result.Icon).toBe('UserMinus');
    expect(result.avatar?.name).toBe('Lior');
  });

  it('BOOK_INVITE — Bookmark icon, info color, bookInvite action, no route', () => {
    const n: Notification = {
      ...BASE,
      type: 'BOOK_INVITE',
      payload: {
        fromUserId: ID.user,
        fromUserName: 'Roni',
        bookId: ID.book,
        bookName: 'Family Recipes',
        role: 'editor',
      },
    };
    const result = getNotificationContent(n, t);
    expect(result.Icon).toBe('Bookmark');
    expect(result.color).toBe('info');
    expect(result.action).toEqual({ kind: 'bookInvite', bookId: ID.book });
    expect(result.route).toBeUndefined();
    expect(result.avatar).toBeUndefined();
  });

  it('BOOK_INVITE_ACCEPTED — BookCheck icon, success color, route to book, no action', () => {
    const n: Notification = {
      ...BASE,
      type: 'BOOK_INVITE_ACCEPTED',
      payload: {
        fromUserId: ID.user,
        fromUserName: 'Roni',
        bookId: ID.book,
        bookName: 'Family Recipes',
      },
    };
    const result = getNotificationContent(n, t);
    expect(result.Icon).toBe('BookCheck');
    expect(result.color).toBe('success');
    expect(result.route).toBe(`/books/${ID.book}`);
    expect(result.action).toBeUndefined();
    expect(result.avatar).toBeUndefined();
  });

  it('BOOK_INVITE_REJECTED — BookX icon, warning color, no route, no action', () => {
    const n: Notification = {
      ...BASE,
      type: 'BOOK_INVITE_REJECTED',
      payload: {
        fromUserId: ID.user,
        fromUserName: 'Roni',
        bookId: ID.book,
        bookName: 'Family Recipes',
      },
    };
    const result = getNotificationContent(n, t);
    expect(result.Icon).toBe('BookX');
    expect(result.color).toBe('warning');
    expect(result.route).toBeUndefined();
    expect(result.action).toBeUndefined();
    expect(result.avatar).toBeUndefined();
  });
});
