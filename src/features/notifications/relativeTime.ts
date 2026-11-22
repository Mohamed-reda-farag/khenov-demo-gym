import type { TFunction } from 'i18next';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/** "Just now", "5 min ago", "3 hours ago", "2 days ago". Older than a week: `olderLabel`. */
export function relativeTime(
  t: TFunction,
  iso: string,
  nowMs: number,
  number: (n: number) => string,
  olderLabel: string,
): string {
  const age = Math.max(0, nowMs - Date.parse(iso));
  if (age < MINUTE) return t('notifications.justNow');
  if (age < HOUR) {
    const count = Math.floor(age / MINUTE);
    return t('notifications.ago.minutes', { count, countText: number(count) });
  }
  if (age < DAY) {
    const count = Math.floor(age / HOUR);
    return t('notifications.ago.hours', { count, countText: number(count) });
  }
  if (age < WEEK) {
    const count = Math.floor(age / DAY);
    return t('notifications.ago.days', { count, countText: number(count) });
  }
  return olderLabel;
}
