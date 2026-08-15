// Push notification title + body for every notification type, in each locale.
// Strings are intentionally kept in sync with apps/mobile/src/locales/*.json.
// Simple template interpolation replaces {{key}} placeholders.

function interpolate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}

type PushCopy = {
  title: string;
  body: string;
};

type LocaleCopy = {
  he: PushCopy;
  en: PushCopy;
};

const messages: Record<string, LocaleCopy> = {
  SHARE_REQUEST: {
    en: { title: 'Share request', body: '{{name}} wants to share {{resource}} with you' },
    he: { title: 'בקשת שיתוף', body: '{{name}} רוצה לשתף איתך את {{resource}}' },
  },
  SHARE_ACCEPTED: {
    en: { title: 'Share accepted', body: '{{name}} accepted your share of {{resource}}' },
    he: { title: 'השיתוף אושר', body: '{{name}} אישר/ה את השיתוף של {{resource}}' },
  },
  SHARE_REJECTED: {
    en: { title: 'Share declined', body: '{{name}} declined your share of {{resource}}' },
    he: { title: 'השיתוף נדחה', body: '{{name}} דחה/תה את השיתוף של {{resource}}' },
  },
  OWNER_DELETED_RESOURCE: {
    en: { title: 'Shared item removed', body: '{{name}} deleted {{resource}} — do you want to save a copy?' },
    he: { title: 'פריט משותף הוסר', body: '{{name}} מחק/ה את {{resource}} — האם תרצה/י לשמור עותק?' },
  },
  FRIEND_REQUEST: {
    en: { title: 'Friend request', body: '{{name}} sent you a friend request' },
    he: { title: 'בקשת חברות', body: '{{name}} שלח/ה לך בקשת חברות' },
  },
  FRIEND_ACCEPTED: {
    en: { title: 'Friend request accepted', body: '{{name}} accepted your friend request' },
    he: { title: 'בקשת החברות אושרה', body: '{{name}} אישר/ה את בקשת החברות שלך' },
  },
  FRIEND_UNFRIENDED: {
    en: { title: 'Removed from friends', body: '{{name}} removed you from their friends' },
    he: { title: 'הוסרת מרשימת החברים', body: '{{name}} הסיר/ה אותך מרשימת החברים' },
  },
  BOOK_INVITE: {
    en: { title: 'Book invitation', body: '{{name}} invited you to collaborate on "{{book}}"' },
    he: { title: 'הזמנה לספר', body: '{{name}} הזמין/ה אותך לשתף פעולה על "{{book}}"' },
  },
  BOOK_INVITE_ACCEPTED: {
    en: { title: 'Invitation accepted', body: '{{name}} accepted your invitation to "{{book}}"' },
    he: { title: 'ההזמנה אושרה', body: '{{name}} אישר/ה את ההזמנה שלך ל"{{book}}"' },
  },
  BOOK_INVITE_REJECTED: {
    en: { title: 'Invitation declined', body: '{{name}} declined your invitation to "{{book}}"' },
    he: { title: 'ההזמנה נדחתה', body: '{{name}} דחה/תה את ההזמנה שלך ל"{{book}}"' },
  },
};

// Maps each notification type's payload keys to the {{placeholder}} names used above.
const payloadVars: Record<string, (payload: Record<string, unknown>) => Record<string, unknown>> = {
  SHARE_REQUEST:          (p) => ({ name: p.fromUserName, resource: p.resourceName }),
  SHARE_ACCEPTED:         (p) => ({ name: p.fromUserName, resource: p.resourceName }),
  SHARE_REJECTED:         (p) => ({ name: p.fromUserName, resource: p.resourceName }),
  OWNER_DELETED_RESOURCE: (p) => ({ name: p.fromUserName, resource: p.resourceName }),
  FRIEND_REQUEST:         (p) => ({ name: p.fromUserName }),
  FRIEND_ACCEPTED:        (p) => ({ name: p.fromUserName }),
  FRIEND_UNFRIENDED:      (p) => ({ name: p.fromUserName }),
  BOOK_INVITE:            (p) => ({ name: p.fromUserName, book: p.bookName }),
  BOOK_INVITE_ACCEPTED:  (p) => ({ name: p.fromUserName, book: p.bookName }),
  BOOK_INVITE_REJECTED:  (p) => ({ name: p.fromUserName, book: p.bookName }),
};

export function getPushMessage(
  type: string,
  payload: Record<string, unknown>,
  locale: 'he' | 'en',
): PushCopy | null {
  const copy = messages[type]?.[locale];
  if (!copy) return null;
  const vars = payloadVars[type]?.(payload) ?? {};
  return {
    title: interpolate(copy.title, vars),
    body: interpolate(copy.body, vars),
  };
}
