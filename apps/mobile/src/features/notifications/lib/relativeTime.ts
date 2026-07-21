import type { TFunction } from 'i18next';

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * Compact, localized "time ago" for a notification timestamp. Uses simple
 * {{count}} interpolation (no grammatical plural) to stay correct across he/en.
 */
export function formatRelativeTime(iso: string, t: TFunction): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));

  if (seconds < MINUTE) return t('notifications.time.now');
  if (seconds < HOUR) return t('notifications.time.minutes', { count: Math.floor(seconds / MINUTE) });
  if (seconds < DAY) return t('notifications.time.hours', { count: Math.floor(seconds / HOUR) });
  if (seconds < WEEK) return t('notifications.time.days', { count: Math.floor(seconds / DAY) });
  return t('notifications.time.weeks', { count: Math.floor(seconds / WEEK) });
}
