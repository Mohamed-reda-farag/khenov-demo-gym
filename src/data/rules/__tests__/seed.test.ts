import { describe, expect, it } from 'vitest';

import { buildSeed } from '../../seed';
import { generateSessionTimings } from '../sessions';
import { toSessionView } from '../booking';

describe('seed relative to today', () => {
  it('seeds two upcoming, non-overlapping bookings on any day of the week and any hour', () => {
    for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
      for (const hour of [0, 7, 12, 19, 23]) {
        const now = new Date(2026, 10, 14 + dayOffset, hour, 30);
        const seed = buildSeed(now);
        const { bookings } = seed.bookingState;
        expect(bookings).toHaveLength(2);
        const sorted = [...bookings].sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
        for (const b of sorted) expect(Date.parse(b.startAt)).toBeGreaterThan(now.getTime());
        expect(Date.parse(sorted[0]!.endAt)).toBeLessThanOrEqual(Date.parse(sorted[1]!.startAt));
      }
    }
  });

  it('keeps the demo states reachable: full with waitlist, nearly full, open', () => {
    const now = new Date(2026, 10, 18, 12);
    const seed = buildSeed(now);
    const trainer = seed.trainers[0]!;
    const views = generateSessionTimings(seed.classTemplates, now).map((timing) => {
      const template = seed.classTemplates.find((t) => t.id === timing.templateId)!;
      return toSessionView(template, trainer, timing, seed.bookingState, now);
    });
    const future = views.filter((v) => v.slot !== 'ended');
    expect(future.some((v) => v.slot === 'full' && v.waitlistCount > 0)).toBe(true);
    expect(future.some((v) => v.slot === 'open' && v.spotsLeft === 1)).toBe(true);
    expect(future.some((v) => v.slot === 'open' && v.spotsLeft > 5)).toBe(true);
    expect(future.some((v) => v.slot === 'booked')).toBe(true);
  });

  it('schedules workouts on some days and leaves rest days', () => {
    const seed = buildSeed(new Date(2026, 10, 18));
    const days = new Set(seed.workoutSchedule.map((e) => e.dayOfWeek));
    expect(days.size).toBeGreaterThan(0);
    expect(days.size).toBeLessThan(7);
  });
});
