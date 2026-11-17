import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { ClassCategory, ClassSessionView, ClassSlotState, Level } from '@/data/types';
import { useFormat } from '@/lib/format';

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** All the wording a class needs, in the current language. */
export function useClassText() {
  const { t } = useTranslation();
  const format = useFormat();
  const lang = format.language;

  return useMemo(
    () => ({
      name: (view: Pick<ClassSessionView, 'name'>) => view.name[lang],
      trainer: (view: Pick<ClassSessionView, 'trainer'>) => view.trainer.name[lang],
      room: (view: Pick<ClassSessionView, 'room'>) => view.room[lang],
      level: (level: Level) => t(`classes.level.${level}`),
      category: (category: ClassCategory) => t(`classes.category.${category}`),
      slot: (slot: ClassSlotState) => t(`classes.slot.${slot}`),
      minutes: (n: number) => t('units.minutes', { count: n, countText: format.number(n) }),
      spotsLeft: (n: number) => t('units.spotsLeft', { count: n, countText: format.number(n) }),
      members: (n: number) => t('units.members', { count: n, countText: format.number(n) }),
      classes: (n: number) => t('units.classes', { count: n, countText: format.number(n) }),
      years: (n: number) => t('units.years', { count: n, countText: format.number(n) }),
      /** "Today 6:00 PM", "Tomorrow 6:00 PM" or "Thursday 6:00 PM". */
      when: (startIso: string, now: Date = new Date()) => {
        const start = new Date(startIso);
        const time = format.time(startIso);
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        if (sameDay(start, now)) return t('home.next.today', { time });
        if (sameDay(start, tomorrow)) return t('home.next.tomorrow', { time });
        return t('home.next.day', { weekday: format.weekday(start), time });
      },
      /** "Thursday 19 November · 6:00 PM – 6:45 PM". */
      fullWhen: (view: Pick<ClassSessionView, 'startAt' | 'endAt'>) =>
        `${format.weekday(new Date(view.startAt))} ${format.dayMonth(new Date(view.startAt))} · ${format.timeRange(view.startAt, view.endAt)}`,
    }),
    [t, format, lang],
  );
}
