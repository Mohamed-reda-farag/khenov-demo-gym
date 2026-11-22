import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { LucideIcon } from '@/components/ui/icons';
import { CalendarCheck, CreditCard, Hourglass, Trophy } from '@/components/ui/icons';
import type { AppNotification, NotificationKind } from '@/data/types';
import { useFormat } from '@/lib/format';

export const KIND_ICON: Record<NotificationKind, LucideIcon> = {
  class_reminder: CalendarCheck,
  waitlist: Hourglass,
  achievement: Trophy,
  payment: CreditCard,
};

/** Where tapping a notification leads. */
export const KIND_ROUTE: Record<NotificationKind, '/classes' | '/progress' | '/membership'> = {
  class_reminder: '/classes',
  waitlist: '/classes',
  achievement: '/progress',
  payment: '/membership',
};

/** Writes a notification in the current language, so switching language updates the inbox. */
export function useNotificationText() {
  const { t } = useTranslation();
  const format = useFormat();

  return useCallback(
    (n: AppNotification): { title: string; body: string } => {
      const p = n.payload;
      const lang = format.language;
      switch (p.kind) {
        case 'class_reminder':
        case 'waitlist':
          return {
            title: t(`notifications.kinds.${p.kind}.title`),
            body: t(`notifications.kinds.${p.kind}.body`, {
              name: p.className[lang],
              day: format.weekdayName(p.weekday),
              time: format.clock(p.time),
            }),
          };
        case 'achievement':
          return {
            title: t('notifications.kinds.achievement.title'),
            body: t('notifications.kinds.achievement.body', { title: p.title[lang] }),
          };
        case 'payment':
          return {
            title: t('notifications.kinds.payment.title'),
            body: t('notifications.kinds.payment.body', {
              amount: format.currency(p.amountEgp),
              plan: p.planName[lang],
            }),
          };
      }
    },
    [t, format],
  );
}
