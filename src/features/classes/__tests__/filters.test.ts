import { describe, expect, it } from 'vitest';

import type { ClassSessionView } from '@/data/types';

import { applyFilters, countActiveFilters, EMPTY_FILTERS, timeOfDay, toggle } from '../filters';

function view(overrides: Partial<ClassSessionView> & { hour: number }): ClassSessionView {
  const { hour, ...rest } = overrides;
  const start = new Date(2026, 10, 19, hour, 0);
  return {
    id: `s-${hour}`,
    templateId: 't',
    name: { ar: 'حصة', en: 'Class' },
    description: { ar: 'وصف', en: 'Desc' },
    requirements: [],
    trainer: {
      id: 'trainer-a',
      name: { ar: 'أ', en: 'A' },
      specialty: { ar: 'ت', en: 'S' },
      bio: { ar: 'ن', en: 'B' },
      yearsExperience: 3,
    },
    room: { ar: 'غرفة', en: 'Room' },
    level: 'beginner',
    category: 'strength',
    durationMin: 45,
    startAt: start.toISOString(),
    endAt: new Date(start.getTime() + 45 * 60_000).toISOString(),
    capacity: 10,
    bookedCount: 3,
    spotsLeft: 7,
    waitlistCount: 0,
    slot: 'open',
    waitlistPosition: null,
    canCancel: false,
    cancelDeadline: start.toISOString(),
    ...rest,
  };
}

describe('timeOfDay', () => {
  it('splits the day at 12:00 and 17:00', () => {
    expect(timeOfDay(view({ hour: 7 }).startAt)).toBe('morning');
    expect(timeOfDay(view({ hour: 11 }).startAt)).toBe('morning');
    expect(timeOfDay(view({ hour: 12 }).startAt)).toBe('afternoon');
    expect(timeOfDay(view({ hour: 16 }).startAt)).toBe('afternoon');
    expect(timeOfDay(view({ hour: 17 }).startAt)).toBe('evening');
    expect(timeOfDay(view({ hour: 22 }).startAt)).toBe('evening');
  });
});

describe('applyFilters', () => {
  const sessions = [
    view({ hour: 7, category: 'mind_body' }),
    view({ hour: 13, category: 'cardio' }),
    view({
      hour: 19,
      category: 'hiit',
      trainer: { ...view({ hour: 1 }).trainer, id: 'trainer-b' },
    }),
  ];

  it('returns everything when no filter is active', () => {
    expect(applyFilters(sessions, EMPTY_FILTERS)).toHaveLength(3);
  });

  it('matches any value inside a group and all groups together', () => {
    expect(
      applyFilters(sessions, { ...EMPTY_FILTERS, categories: ['cardio', 'hiit'] }),
    ).toHaveLength(2);
    expect(
      applyFilters(sessions, {
        categories: ['cardio', 'hiit'],
        trainerIds: ['trainer-b'],
        times: [],
      }),
    ).toHaveLength(1);
    expect(applyFilters(sessions, { ...EMPTY_FILTERS, times: ['morning'] })).toHaveLength(1);
    expect(
      applyFilters(sessions, { categories: ['mind_body'], trainerIds: [], times: ['evening'] }),
    ).toHaveLength(0);
  });

  it('counts active filters and toggles values', () => {
    expect(countActiveFilters({ categories: ['hiit'], trainerIds: ['a', 'b'], times: [] })).toBe(3);
    expect(toggle(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggle(['a', 'b'], 'a')).toEqual(['b']);
  });
});
