import type {
  AppNotification,
  NotificationKind,
  NotificationPayload,
  NotificationSettings,
} from '../types';

export const MAX_NOTIFICATIONS = 40;

export const SETTING_OF_KIND: Record<NotificationKind, keyof NotificationSettings> = {
  class_reminder: 'classReminders',
  waitlist: 'waitlist',
  achievement: 'achievements',
  payment: 'payments',
};

export const defaultNotificationSettings: NotificationSettings = {
  classReminders: true,
  waitlist: true,
  achievements: true,
  payments: true,
};

function effectiveTime(n: AppNotification, now: Date): number {
  return n.seedAgeMinutes === undefined
    ? Date.parse(n.createdAt)
    : now.getTime() - n.seedAgeMinutes * 60_000;
}

/** Seeded notifications follow today. Newest first. */
export function resolveNotifications(items: AppNotification[], now: Date): AppNotification[] {
  return items
    .map((n) => ({ ...n, createdAt: new Date(effectiveTime(n, now)).toISOString() }))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export const unreadCount = (items: AppNotification[]): number =>
  items.filter((n) => !n.read).length;

export function isEnabled(kind: NotificationKind, settings: NotificationSettings): boolean {
  return settings[SETTING_OF_KIND[kind]];
}

/** Adds a new unread notification and keeps only the newest ones. Stored form in, stored form out. */
export function addNotification(
  items: AppNotification[],
  payload: NotificationPayload,
  now: Date,
  id: string,
): AppNotification[] {
  const created: AppNotification = { id, payload, createdAt: now.toISOString(), read: false };
  return [...items, created]
    .sort((a, b) => effectiveTime(b, now) - effectiveTime(a, now))
    .slice(0, MAX_NOTIFICATIONS);
}

export const markRead = (items: AppNotification[], id: string): AppNotification[] =>
  items.map((n) => (n.id === id ? { ...n, read: true } : n));

export const markAllRead = (items: AppNotification[]): AppNotification[] =>
  items.map((n) => (n.read ? n : { ...n, read: true }));

/** Weekday (0 = Sunday) and "HH:mm" of a start time, for the class notifications. */
export function whenOf(startIso: string): { weekday: number; time: string } {
  const d = new Date(startIso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return { weekday: d.getDay(), time: `${hh}:${mm}` };
}
