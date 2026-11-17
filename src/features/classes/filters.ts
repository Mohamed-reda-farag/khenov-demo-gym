import type { ClassCategory, ClassSessionView } from '@/data/types';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export interface ClassFilters {
  categories: ClassCategory[];
  trainerIds: string[];
  times: TimeOfDay[];
}

export const EMPTY_FILTERS: ClassFilters = { categories: [], trainerIds: [], times: [] };

export const CATEGORIES: readonly ClassCategory[] = ['strength', 'cardio', 'hiit', 'mind_body'];
export const TIMES_OF_DAY: readonly TimeOfDay[] = ['morning', 'afternoon', 'evening'];

/** Before 12:00 is morning, 12:00 to 16:59 afternoon, from 17:00 evening. */
export function timeOfDay(startIso: string): TimeOfDay {
  const hour = new Date(startIso).getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export function countActiveFilters(filters: ClassFilters): number {
  return filters.categories.length + filters.trainerIds.length + filters.times.length;
}

export function applyFilters(
  sessions: ClassSessionView[],
  filters: ClassFilters,
): ClassSessionView[] {
  return sessions.filter(
    (s) =>
      (filters.categories.length === 0 || filters.categories.includes(s.category)) &&
      (filters.trainerIds.length === 0 || filters.trainerIds.includes(s.trainer.id)) &&
      (filters.times.length === 0 || filters.times.includes(timeOfDay(s.startAt))),
  );
}

export function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}
