import { describe, expect, it } from 'vitest';

import { buildSeed } from '../../seed';
import { generateSessionTimings } from '../sessions';
import {
  applyBook,
  applyCancel,
  applyUndoCancel,
  syncDemoBookings,
  toSessionView,
} from '../booking';

function upcomingDemo(state: ReturnType<typeof syncDemoBookings>, now: Date) {
  return state.bookings
    .filter(
      (b) => b.status === 'booked' && b.source === 'demo' && Date.parse(b.startAt) > now.getTime(),
    )
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
}

describe('demo bookings follow today at runtime', () => {
  it('stores no fixed bookings in the seed', () => {
    const seed = buildSeed(new Date(2026, 10, 18, 12));
    expect(seed.bookingState.bookings).toHaveLength(0);
    expect(seed.bookingState.demoSlots).toHaveLength(2);
  });

  it('always has 2 upcoming, non-overlapping bookings on 14 different days and several hours', () => {
    for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
      for (const hour of [0, 7, 12, 19, 23]) {
        const now = new Date(2026, 10, 14 + dayOffset, hour, 30);
        const seed = buildSeed(new Date(2026, 10, 1));
        const state = syncDemoBookings(seed.bookingState, { templates: seed.classTemplates, now });
        const upcoming = upcomingDemo(state, now);
        expect(upcoming).toHaveLength(2);
        expect(Date.parse(upcoming[0]!.endAt)).toBeLessThanOrEqual(
          Date.parse(upcoming[1]!.startAt),
        );
      }
    }
  });

  it('keeps 2 upcoming bookings when the stored state ages day after day', () => {
    const seed = buildSeed(new Date(2026, 10, 1, 9));
    let state = seed.bookingState;
    for (let day = 0; day < 40; day += 1) {
      const now = new Date(2026, 10, 1 + day, 13, 0);
      state = syncDemoBookings(state, { templates: seed.classTemplates, now });
      expect(upcomingDemo(state, now)).toHaveLength(2);
      expect(state.bookings.length).toBeLessThanOrEqual(2);
    }
  });

  it('does not bring back a demo class the member cancelled, and leaves their own bookings alone', () => {
    const seed = buildSeed(new Date(2026, 10, 1));
    const now = new Date(2026, 10, 14, 9);
    const ctx = { templates: seed.classTemplates, now };
    let state = syncDemoBookings(seed.bookingState, ctx);
    const target = upcomingDemo(state, now)[0]!;
    state = applyCancel(state, target.sessionId, ctx);
    const later = new Date(2026, 10, 22, 9);
    const after = syncDemoBookings(state, { templates: seed.classTemplates, now: later });
    expect(upcomingDemo(after, later)).toHaveLength(1);
    expect(after.demoSlots.find((s) => s.templateId === target.templateId)?.status).toBe(
      'released',
    );
    const restored = applyUndoCancel(state, target.sessionId, ctx);
    expect(restored.demoSlots.every((s) => s.status === 'active')).toBe(true);
  });

  it('keeps bookings the member made themselves exactly as stored', () => {
    const seed = buildSeed(new Date(2026, 10, 1));
    const now = new Date(2026, 10, 14, 9);
    const ctx = { templates: seed.classTemplates, now };
    const synced = syncDemoBookings(seed.bookingState, ctx);
    const free = generateSessionTimings(seed.classTemplates, now).find(
      (t) => t.templateId === 'class-sunrise-yoga' && t.startMs > now.getTime(),
    )!;
    const withMine = applyBook(synced, free.id, ctx);
    const later = new Date(2026, 10, 30, 9);
    const after = syncDemoBookings(withMine, { templates: seed.classTemplates, now: later });
    expect(after.bookings.filter((b) => b.source === 'user')).toHaveLength(1);
  });
});

describe('seed data', () => {
  it('keeps the demo states reachable: full with waitlist, nearly full, open', () => {
    const now = new Date(2026, 10, 18, 12);
    const seed = buildSeed(now);
    const trainer = seed.trainers[0]!;
    const state = syncDemoBookings(seed.bookingState, { templates: seed.classTemplates, now });
    const views = generateSessionTimings(seed.classTemplates, now).map((timing) => {
      const template = seed.classTemplates.find((t) => t.id === timing.templateId)!;
      return toSessionView(template, trainer, timing, state, now);
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
