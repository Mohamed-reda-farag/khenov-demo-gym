import { describe, expect, it } from 'vitest';

import { buildBodyEntries } from '../../seed/progress';
import type { BodyEntry } from '../../types';
import { resolveBodyEntries } from '../body';

const DAY = 86_400_000;
const seedDay = new Date(2026, 5, 10, 15, 30);
const dayOf = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};
const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

describe('seeded body measurements follow today', () => {
  const seeded = buildBodyEntries(seedDay);

  it('on the day of seeding they end today and keep weekly spacing', () => {
    const shown = resolveBodyEntries(seeded, seedDay);
    expect(shown).toHaveLength(8);
    expect(dayOf(shown[7]!.date)).toBe(midnight(seedDay));
    for (let i = 1; i < shown.length; i += 1) {
      expect(Math.round((dayOf(shown[i]!.date) - dayOf(shown[i - 1]!.date)) / DAY)).toBe(7);
    }
  });

  it('after 40 days the newest check-in is still today, never in the past or future', () => {
    const later = new Date(2026, 6, 20, 9, 0);
    const shown = resolveBodyEntries(seeded, later);
    expect(dayOf(shown[7]!.date)).toBe(midnight(later));
    expect(dayOf(shown[0]!.date)).toBe(midnight(later) - 49 * DAY);
    expect(shown.every((e) => Date.parse(e.date) <= later.getTime())).toBe(true);
  });

  it('keeps the measured values untouched', () => {
    const shown = resolveBodyEntries(seeded, new Date(2027, 0, 5));
    expect(shown.map((e) => e.weightKg)).toEqual(seeded.map((e) => e.weightKg));
  });

  it('leaves entries the member added or edited on their own date', () => {
    const mine: BodyEntry = {
      id: 'body-mine',
      date: new Date(2026, 5, 12, 7, 0).toISOString(),
      weightKg: 79,
      waistCm: 87,
      chestCm: 103,
      armCm: 33.5,
    };
    const later = new Date(2026, 7, 1);
    const shown = resolveBodyEntries([...seeded, mine], later);
    expect(shown.find((e) => e.id === 'body-mine')?.date).toBe(mine.date);
  });

  it('sorts oldest first when user entries and shifted seeds mix', () => {
    const mine: BodyEntry = {
      id: 'body-mine',
      date: new Date(2026, 5, 11).toISOString(),
      weightKg: 79,
      waistCm: 87,
      chestCm: 103,
      armCm: 33.5,
    };
    const shown = resolveBodyEntries([mine, ...seeded], new Date(2026, 6, 20));
    const times = shown.map((e) => Date.parse(e.date));
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});
