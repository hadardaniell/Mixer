import { describe, expect, it } from 'vitest';
import { getPushMessage } from '../push-messages.js';

describe('getPushMessage', () => {
  describe('SHARE_REQUEST', () => {
    const payload = { fromUserName: 'Alice', resourceName: 'Pasta Recipe' };

    it('returns English push copy with interpolated name and resource', () => {
      const result = getPushMessage('SHARE_REQUEST', payload, 'en');
      expect(result).toEqual({
        title: 'Share request',
        body: 'Alice wants to share Pasta Recipe with you',
      });
    });

    it('returns Hebrew push copy with interpolated values', () => {
      const result = getPushMessage('SHARE_REQUEST', payload, 'he');
      expect(result).toEqual({
        title: 'בקשת שיתוף',
        body: 'Alice רוצה לשתף איתך את Pasta Recipe',
      });
    });
  });

  describe('SHARE_ACCEPTED', () => {
    const payload = { fromUserName: 'Bob', resourceName: 'Shakshuka' };

    it('returns English copy with name and resource', () => {
      const result = getPushMessage('SHARE_ACCEPTED', payload, 'en');
      expect(result?.title).toBe('Share accepted');
      expect(result?.body).toBe('Bob accepted your share of Shakshuka');
    });

    it('returns Hebrew title', () => {
      const result = getPushMessage('SHARE_ACCEPTED', payload, 'he');
      expect(result?.title).toBe('השיתוף אושר');
    });
  });

  describe('SHARE_REJECTED', () => {
    it('returns English body with name and resource', () => {
      const result = getPushMessage('SHARE_REJECTED', { fromUserName: 'Eve', resourceName: 'Hummus' }, 'en');
      expect(result?.body).toBe('Eve declined your share of Hummus');
    });
  });

  describe('OWNER_DELETED_RESOURCE', () => {
    it('returns English body with both name and resource', () => {
      const result = getPushMessage('OWNER_DELETED_RESOURCE', { fromUserName: 'Dani', resourceName: 'Cholent' }, 'en');
      expect(result?.body).toBe('Dani deleted Cholent — do you want to save a copy?');
    });

    it('returns Hebrew body', () => {
      const result = getPushMessage('OWNER_DELETED_RESOURCE', { fromUserName: 'דני', resourceName: 'חמין' }, 'he');
      expect(result?.body).toBe('דני מחק/ה את חמין — האם תרצה/י לשמור עותק?');
    });
  });

  describe('FRIEND_REQUEST', () => {
    it('returns English body with name only', () => {
      const result = getPushMessage('FRIEND_REQUEST', { fromUserName: 'Sara' }, 'en');
      expect(result?.body).toBe('Sara sent you a friend request');
    });

    it('returns Hebrew title and body', () => {
      const result = getPushMessage('FRIEND_REQUEST', { fromUserName: 'סרה' }, 'he');
      expect(result?.title).toBe('בקשת חברות');
      expect(result?.body).toBe('סרה שלח/ה לך בקשת חברות');
    });
  });

  describe('FRIEND_ACCEPTED', () => {
    it('returns English body', () => {
      const result = getPushMessage('FRIEND_ACCEPTED', { fromUserName: 'Tom' }, 'en');
      expect(result?.body).toBe('Tom accepted your friend request');
    });
  });

  describe('FRIEND_UNFRIENDED', () => {
    it('returns Hebrew title', () => {
      const result = getPushMessage('FRIEND_UNFRIENDED', { fromUserName: 'יואב' }, 'he');
      expect(result?.title).toBe('הוסרת מרשימת החברים');
    });
  });

  describe('BOOK_INVITE', () => {
    const payload = { fromUserName: 'Lior', bookName: 'Family Recipes' };

    it('returns English body with book placeholder', () => {
      const result = getPushMessage('BOOK_INVITE', payload, 'en');
      expect(result?.body).toBe('Lior invited you to collaborate on "Family Recipes"');
    });

    it('returns Hebrew title and body with book placeholder', () => {
      const result = getPushMessage('BOOK_INVITE', payload, 'he');
      expect(result?.title).toBe('הזמנה לספר');
      expect(result?.body).toBe('Lior הזמין/ה אותך לשתף פעולה על "Family Recipes"');
    });
  });

  describe('BOOK_INVITE_ACCEPTED', () => {
    const payload = { fromUserName: 'Roni', bookName: 'Family Recipes' };

    it('returns English title and body with name and book', () => {
      const result = getPushMessage('BOOK_INVITE_ACCEPTED', payload, 'en');
      expect(result?.title).toBe('Invitation accepted');
      expect(result?.body).toBe('Roni accepted your invitation to "Family Recipes"');
    });

    it('returns Hebrew title and body', () => {
      const result = getPushMessage('BOOK_INVITE_ACCEPTED', payload, 'he');
      expect(result?.title).toBe('ההזמנה אושרה');
      expect(result?.body).toBe('Roni אישר/ה את ההזמנה שלך ל"Family Recipes"');
    });
  });

  describe('BOOK_INVITE_REJECTED', () => {
    const payload = { fromUserName: 'Roni', bookName: 'Family Recipes' };

    it('returns English title and body with name and book', () => {
      const result = getPushMessage('BOOK_INVITE_REJECTED', payload, 'en');
      expect(result?.title).toBe('Invitation declined');
      expect(result?.body).toBe('Roni declined your invitation to "Family Recipes"');
    });

    it('returns Hebrew title and body', () => {
      const result = getPushMessage('BOOK_INVITE_REJECTED', payload, 'he');
      expect(result?.title).toBe('ההזמנה נדחתה');
      expect(result?.body).toBe('Roni דחה/תה את ההזמנה שלך ל"Family Recipes"');
    });
  });

  describe('edge cases', () => {
    it('returns null for an unknown notification type', () => {
      expect(getPushMessage('UNKNOWN_TYPE', {}, 'en')).toBeNull();
    });

    it('replaces missing payload fields with empty string instead of crashing', () => {
      const result = getPushMessage('SHARE_REQUEST', {}, 'en');
      expect(result?.body).toBe(' wants to share  with you');
    });
  });
});
