import { describe, expect, it } from 'vitest';

import { buildNotifications } from '../../seed/notifications';
import { classTemplates } from '../../seed/classes';
import { buildMembership, membershipPlans } from '../../seed/plans';
import type { AppNotification, NotificationPayload } from '../../types';
import {
  MAX_NOTIFICATIONS,
  addNotification,
  defaultNotificationSettings,
  isEnabled,
  markAllRead,
  markRead,
  resolveNotifications,
  unreadCount,
  whenOf,
} from '../notifications';

const now = new Date(2026, 10, 21, 18, 0);
const payment: NotificationPayload = {
  kind: 'payment',
  planName: { ar: 'شهري', en: 'Monthly' },
  amountEgp: 900,
};
const seed = buildNotifications(
  now,
  ['first-workout', 'first-pr'],
  classTemplates.find((c) => c.id === 'class-core-express'),
  buildMembership(now),
  membershipPlans,
);

describe('seeded notifications', () => {
  it('has a class reminder, two badges and a payment, with some unread', () => {
    expect(seed.map((n) => n.payload.kind).sort()).toEqual([
      'achievement',
      'achievement',
      'class_reminder',
      'payment',
    ]);
    expect(unreadCount(seed)).toBe(2);
  });

  it('follows today: the same ages whenever the demo is opened', () => {
    for (const day of [now, new Date(2027, 3, 2, 9, 30)]) {
      const shown = resolveNotifications(seed, day);
      expect(shown[0]!.payload.kind).toBe('class_reminder');
      expect(day.getTime() - Date.parse(shown[0]!.createdAt)).toBe(180 * 60_000);
      expect(shown.every((n) => Date.parse(n.createdAt) <= day.getTime())).toBe(true);
      const times = shown.map((n) => Date.parse(n.createdAt));
      expect(times).toEqual([...times].sort((a, b) => b - a));
    }
  });
});

describe('adding and reading', () => {
  it('adds a new unread notification at the top', () => {
    const next = addNotification(seed, payment, now, 'n-new');
    const shown = resolveNotifications(next, now);
    expect(shown[0]).toMatchObject({ id: 'n-new', read: false });
    expect(unreadCount(next)).toBe(3);
  });

  it('keeps only the newest ones', () => {
    let items: AppNotification[] = [];
    for (let i = 0; i < MAX_NOTIFICATIONS + 5; i += 1) {
      items = addNotification(items, payment, new Date(now.getTime() + i * 1000), `n-${i}`);
    }
    expect(items).toHaveLength(MAX_NOTIFICATIONS);
    expect(items.some((n) => n.id === 'n-0')).toBe(false);
    expect(items.some((n) => n.id === `n-${MAX_NOTIFICATIONS + 4}`)).toBe(true);
  });

  it('marks one or all as read without touching the others', () => {
    const unread = seed.filter((n) => !n.read);
    const one = markRead(seed, unread[0]!.id);
    expect(unreadCount(one)).toBe(1);
    expect(unreadCount(markAllRead(seed))).toBe(0);
    expect(markRead(seed, 'missing')).toEqual(seed);
  });
});

describe('settings', () => {
  it('maps every kind to its own toggle', () => {
    const off = { ...defaultNotificationSettings, achievements: false, payments: false };
    expect(isEnabled('class_reminder', off)).toBe(true);
    expect(isEnabled('waitlist', off)).toBe(true);
    expect(isEnabled('achievement', off)).toBe(false);
    expect(isEnabled('payment', off)).toBe(false);
  });

  it('reads the weekday and clock time of a class start', () => {
    expect(whenOf(new Date(2026, 10, 22, 7, 5).toISOString())).toEqual({
      weekday: 0,
      time: '07:05',
    });
  });
});
