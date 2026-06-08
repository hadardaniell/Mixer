type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

/**
 * Formats a minutes count for display, promoting to hours when it reads better:
 *   45  → "45 דק'"        | "45 min"
 *   60  → "שעה"           | "1 hr"
 *   120 → "שעתיים"        | "2 hr"
 *   90  → "שעה ו-30 דק'"  | "1 hr 30 min"
 * Returns '' for missing/zero so callers can skip rendering.
 */
export function formatDuration(totalMinutes: number | undefined | null, t: TranslateFn): string {
  if (!totalMinutes || totalMinutes <= 0) return '';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const hoursPart =
    hours === 0
      ? ''
      : hours === 1
        ? t('time.hour')
        : hours === 2
          ? t('time.twoHours')
          : t('time.hours', { count: hours });
  const minutesPart = minutes === 0 ? '' : t('time.min', { count: minutes });

  if (hoursPart && minutesPart) return `${hoursPart}${t('time.and')}${minutesPart}`;
  return hoursPart || minutesPart;
}
