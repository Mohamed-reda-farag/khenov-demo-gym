import { delay } from '@/lib/demo/delay';
import { hasDemoFlag } from '@/lib/demo/flags';

import {
  addNotification,
  markAllRead,
  markRead,
  resolveNotifications,
  isEnabled,
  unreadCount,
} from '../rules/notifications';
import type { AppNotification, NotificationPayload } from '../types';

import { emitNotificationsChanged } from './events';
import type { NotificationRepository } from './interfaces';
import { readCollection, serial, writeCollection } from './local-core';

const QUICK = [0, 0] as const;

/** `?demo=empty` hides the seeded notifications, so the empty state can be reached. */
async function load(now: Date): Promise<AppNotification[]> {
  const stored = await readCollection('notifications', QUICK);
  const visible = hasDemoFlag('empty')
    ? stored.filter((n) => n.seedAgeMinutes === undefined)
    : stored;
  return resolveNotifications(visible, now);
}

/**
 * Called by the repositories after a real action. Never throws: a missed notification must not
 * fail the booking, workout or payment that caused it. Runs inside the caller's serial task.
 */
export async function notify(payload: NotificationPayload): Promise<void> {
  try {
    const [items, settings] = await Promise.all([
      readCollection('notifications', QUICK),
      readCollection('notificationSettings', QUICK),
    ]);
    if (!isEnabled(payload.kind, settings)) return;
    const now = new Date();
    const id = `n-${now.getTime()}-${Math.random().toString(36).slice(2, 6)}`;
    await writeCollection('notifications', addNotification(items, payload, now, id), QUICK);
    emitNotificationsChanged();
  } catch {
    // Intentionally ignored, see above.
  }
}

export const localNotificationRepository: NotificationRepository = {
  async list() {
    await delay();
    return load(new Date());
  },

  async unreadCount() {
    await delay(100, 250);
    return unreadCount(await load(new Date()));
  },

  async markRead(id) {
    await delay(60, 150);
    await serial(async () => {
      const items = await readCollection('notifications', QUICK);
      await writeCollection('notifications', markRead(items, id), QUICK);
      emitNotificationsChanged();
    });
  },

  async markAllRead() {
    await delay(100, 250);
    await serial(async () => {
      const items = await readCollection('notifications', QUICK);
      await writeCollection('notifications', markAllRead(items), QUICK);
      emitNotificationsChanged();
    });
  },

  async getSettings() {
    await delay(100, 250);
    return readCollection('notificationSettings', QUICK);
  },

  async setSetting(key, value) {
    await delay(60, 150);
    return serial(async () => {
      const settings = await readCollection('notificationSettings', QUICK);
      const next = { ...settings, [key]: value };
      await writeCollection('notificationSettings', next, QUICK);
      return next;
    });
  },
};
