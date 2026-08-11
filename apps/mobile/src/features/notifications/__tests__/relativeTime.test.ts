import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TFunction } from 'i18next';
import { formatRelativeTime } from '../lib/relativeTime.js';

const t = ((key: string, opts?: Record<string, unknown>) =>
  opts?.count !== undefined ? `${key}:${opts.count}` : key) as unknown as TFunction;

const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const NOW = new Date('2026-01-01T12:00:00.000Z').getTime();

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "now" for a timestamp 30 seconds ago', () => {
    expect(formatRelativeTime(new Date(NOW - 30 * SEC).toISOString(), t)).toBe('notifications.time.now');
  });

  it('returns "now" for a timestamp 1 second ago', () => {
    expect(formatRelativeTime(new Date(NOW - SEC).toISOString(), t)).toBe('notifications.time.now');
  });

  it('returns minutes at the exact 60-second boundary', () => {
    expect(formatRelativeTime(new Date(NOW - 60 * SEC).toISOString(), t)).toBe('notifications.time.minutes:1');
  });

  it('returns minutes for a timestamp 5 minutes ago', () => {
    expect(formatRelativeTime(new Date(NOW - 5 * MIN).toISOString(), t)).toBe('notifications.time.minutes:5');
  });

  it('returns hours at the exact 1-hour boundary', () => {
    expect(formatRelativeTime(new Date(NOW - HOUR).toISOString(), t)).toBe('notifications.time.hours:1');
  });

  it('returns hours for a timestamp 3 hours ago', () => {
    expect(formatRelativeTime(new Date(NOW - 3 * HOUR).toISOString(), t)).toBe('notifications.time.hours:3');
  });

  it('returns days at the exact 24-hour boundary', () => {
    expect(formatRelativeTime(new Date(NOW - DAY).toISOString(), t)).toBe('notifications.time.days:1');
  });

  it('returns days for a timestamp 2 days ago', () => {
    expect(formatRelativeTime(new Date(NOW - 2 * DAY).toISOString(), t)).toBe('notifications.time.days:2');
  });

  it('returns weeks at the exact 7-day boundary', () => {
    expect(formatRelativeTime(new Date(NOW - WEEK).toISOString(), t)).toBe('notifications.time.weeks:1');
  });

  it('returns weeks for a timestamp 2 weeks ago', () => {
    expect(formatRelativeTime(new Date(NOW - 2 * WEEK).toISOString(), t)).toBe('notifications.time.weeks:2');
  });

  it('treats a future timestamp as "now" (clamps to 0 seconds)', () => {
    expect(formatRelativeTime(new Date(NOW + 10 * SEC).toISOString(), t)).toBe('notifications.time.now');
  });
});
