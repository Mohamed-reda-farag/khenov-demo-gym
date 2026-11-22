import { ACHIEVEMENTS } from '../rules/achievements';
import { whenOf } from '../rules/notifications';
import type { AppNotification, ClassTemplate, Membership, MembershipPlan } from '../types';

const MIN_PER_DAY = 1440;

/**
 * A few notifications that make the inbox feel lived in. Their ages are relative to today at
 * read time, like the generated workout history. They follow the seeded data: the class is the
 * member's standing booking, the payment is the seeded membership, the badges are the earned ones.
 */
export function buildNotifications(
  now: Date,
  unlockedAchievementIds: string[],
  reminderClass: ClassTemplate | undefined,
  membership: Membership,
  plans: MembershipPlan[],
): AppNotification[] {
  const created = now.toISOString();
  const items: AppNotification[] = [];

  if (reminderClass) {
    const when = whenOf(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + ((reminderClass.dayOfWeek - now.getDay() + 7) % 7),
        Number(reminderClass.startTime.slice(0, 2)),
        Number(reminderClass.startTime.slice(3, 5)),
      ).toISOString(),
    );
    items.push({
      id: 'n-seed-reminder',
      payload: { kind: 'class_reminder', className: reminderClass.name, ...when },
      createdAt: created,
      read: false,
      seedAgeMinutes: 180,
    });
  }

  unlockedAchievementIds.slice(0, 2).forEach((id, i) => {
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (!def) return;
    items.push({
      id: `n-seed-achievement-${id}`,
      payload: { kind: 'achievement', title: def.title },
      createdAt: created,
      read: i > 0,
      seedAgeMinutes: MIN_PER_DAY * (i + 1),
    });
  });

  const plan = plans.find((p) => p.id === membership.planId);
  if (plan) {
    items.push({
      id: 'n-seed-payment',
      payload: { kind: 'payment', planName: plan.name, amountEgp: plan.priceEgp },
      createdAt: created,
      read: true,
      seedAgeMinutes: MIN_PER_DAY * 52,
    });
  }
  return items;
}
