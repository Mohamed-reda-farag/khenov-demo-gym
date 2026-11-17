import { describe, expect, it } from 'vitest';

import {
  BookingError,
  CANCEL_CUTOFF_MS,
  UNDO_WINDOW_MS,
  WAITLIST_PROMOTION_DELAY_MS,
  applyBook,
  applyCancel,
  applyJoinWaitlist,
  applyLeaveWaitlist,
  applySettleWaitlist,
  applyUndoBook,
  applyUndoCancel,
  occupancy,
  toSessionView,
  type BookingErrorCode,
} from '../booking';
import { resolveSession } from '../sessions';
import type { Trainer } from '../../types';

import { NOW, ctxAt, emptyState, sessionOn, template } from './fixtures';

const trainer: Trainer = {
  id: 'trainer',
  name: { ar: 'مدرب', en: 'Coach' },
  specialty: { ar: 'قوة', en: 'Strength' },
  bio: { ar: 'نبذة', en: 'Bio' },
  yearsExperience: 5,
};

const day = (offset: number) => new Date(2026, 10, 18 + offset);

function codeOf(fn: () => unknown): BookingErrorCode | 'no-error' {
  try {
    fn();
    return 'no-error';
  } catch (error) {
    if (error instanceof BookingError) return error.code;
    throw error;
  }
}

describe('capacity', () => {
  const open = template({ id: 'open', baseBooked: 9, capacity: 10 });
  const full = template({ id: 'full', baseBooked: 10, capacity: 10, baseWaitlist: 3 });
  const ctx = ctxAt(NOW, [open, full]);

  it('books the last seat, then reports the class as full', () => {
    const id = sessionOn('open', day(1));
    const state = applyBook(emptyState(), id, ctx);
    expect(occupancy(open, state, id).booked).toBe(10);
    const view = toSessionView(
      open,
      trainer,
      resolveSession(ctx.templates, id, NOW)!.timing,
      state,
      NOW,
    );
    expect(view.slot).toBe('booked');
    expect(view.spotsLeft).toBe(0);
  });

  it('rejects booking a full class', () => {
    const id = sessionOn('full', day(1));
    expect(codeOf(() => applyBook(emptyState(), id, ctx))).toBe('class_full');
  });

  it('rejects booking the same class twice', () => {
    const id = sessionOn('open', day(1));
    const state = applyBook(emptyState(), id, ctx);
    expect(codeOf(() => applyBook(state, id, ctx))).toBe('already_booked');
  });

  it('rejects an unknown session', () => {
    expect(codeOf(() => applyBook(emptyState(), 'nope@2026-11-19', ctx))).toBe('not_found');
  });
});

describe('overlap', () => {
  const a = template({ id: 'a', startTime: '18:00', durationMin: 60 });
  const b = template({ id: 'b', startTime: '18:30', durationMin: 45 });
  const c = template({ id: 'c', startTime: '19:00', durationMin: 45 });
  const ctx = ctxAt(NOW, [a, b, c]);

  it('rejects a class that overlaps an existing booking and names the conflict', () => {
    const first = sessionOn('a', day(1));
    const state = applyBook(emptyState(), first, ctx);
    try {
      applyBook(state, sessionOn('b', day(1)), ctx);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(BookingError);
      expect((error as BookingError).code).toBe('overlap');
      expect((error as BookingError).conflictSessionId).toBe(first);
    }
  });

  it('allows back-to-back classes (one ends when the next starts)', () => {
    const state = applyBook(emptyState(), sessionOn('a', day(1)), ctx);
    expect(codeOf(() => applyBook(state, sessionOn('c', day(1)), ctx))).toBe('no-error');
  });

  it('allows the same time on different days', () => {
    const state = applyBook(emptyState(), sessionOn('a', day(1)), ctx);
    expect(codeOf(() => applyBook(state, sessionOn('b', day(8)), ctx))).toBe('no-error');
  });

  it('also blocks joining a waitlist that overlaps a booking', () => {
    const full = template({ id: 'f', startTime: '18:15', baseBooked: 10, capacity: 10 });
    const withFull = ctxAt(NOW, [a, full]);
    const state = applyBook(emptyState(), sessionOn('a', day(1)), withFull);
    expect(codeOf(() => applyJoinWaitlist(state, sessionOn('f', day(1)), withFull))).toBe(
      'overlap',
    );
  });
});

describe('past classes', () => {
  const t = template({ id: 't', startTime: '09:00', dayOfWeek: 3 });
  const ctx = ctxAt(NOW, [t]);

  it('rejects booking a class that already started', () => {
    expect(codeOf(() => applyBook(emptyState(), sessionOn('t', day(0)), ctx))).toBe('in_past');
  });

  it('rejects a class that starts exactly now', () => {
    const atNow = template({ id: 'n', startTime: '12:00', dayOfWeek: 3 });
    expect(codeOf(() => applyBook(emptyState(), sessionOn('n', day(0)), ctxAt(NOW, [atNow])))).toBe(
      'in_past',
    );
  });

  it('marks past sessions as ended in the view', () => {
    const id = sessionOn('t', day(0));
    const view = toSessionView(t, trainer, resolveSession([t], id, NOW)!.timing, emptyState(), NOW);
    expect(view.slot).toBe('ended');
  });
});

describe('cancellation cutoff', () => {
  const t = template({ id: 't', startTime: '18:00', dayOfWeek: 3 });
  const id = sessionOn('t', day(0));

  function booked() {
    const early = ctxAt(new Date(2026, 10, 18, 9, 0), [t]);
    return applyBook(emptyState(), id, early);
  }

  it('allows cancelling more than two hours before the start', () => {
    const ctx = ctxAt(new Date(2026, 10, 18, 15, 0), [t]);
    expect(codeOf(() => applyCancel(booked(), id, ctx))).toBe('no-error');
  });

  it('allows cancelling exactly two hours before', () => {
    const ctx = ctxAt(new Date(2026, 10, 18, 16, 0), [t]);
    expect(codeOf(() => applyCancel(booked(), id, ctx))).toBe('no-error');
  });

  it('rejects cancelling inside the two hour window', () => {
    const ctx = ctxAt(new Date(2026, 10, 18, 16, 1), [t]);
    expect(codeOf(() => applyCancel(booked(), id, ctx))).toBe('cutoff_passed');
  });

  it('rejects cancelling after the class started', () => {
    const ctx = ctxAt(new Date(2026, 10, 18, 18, 30), [t]);
    expect(codeOf(() => applyCancel(booked(), id, ctx))).toBe('in_past');
  });

  it('rejects cancelling something that is not booked', () => {
    expect(codeOf(() => applyCancel(emptyState(), id, ctxAt(NOW, [t])))).toBe('not_booked');
  });

  it('exposes the deadline and canCancel in the view', () => {
    const state = booked();
    const timing = resolveSession([t], id, NOW)!.timing;
    const before = toSessionView(t, trainer, timing, state, new Date(2026, 10, 18, 16, 0));
    const after = toSessionView(t, trainer, timing, state, new Date(2026, 10, 18, 16, 1));
    expect(before.canCancel).toBe(true);
    expect(after.canCancel).toBe(false);
    expect(Date.parse(before.startAt) - Date.parse(before.cancelDeadline)).toBe(CANCEL_CUTOFF_MS);
  });
});

describe('waitlist', () => {
  const full = template({ id: 'full', baseBooked: 10, capacity: 10, baseWaitlist: 2 });
  const quiet = template({ id: 'quiet', startTime: '08:00', baseBooked: 3, capacity: 10 });
  const ctx = ctxAt(NOW, [full, quiet]);
  const id = sessionOn('full', day(1));

  it('only allows joining when the class is full', () => {
    expect(codeOf(() => applyJoinWaitlist(emptyState(), sessionOn('quiet', day(1)), ctx))).toBe(
      'class_not_full',
    );
  });

  it('puts the member behind the people already waiting', () => {
    const state = applyJoinWaitlist(emptyState(), id, ctx);
    const view = toSessionView(full, trainer, resolveSession([full], id, NOW)!.timing, state, NOW);
    expect(view.slot).toBe('waitlisted');
    expect(view.waitlistPosition).toBe(3);
    expect(view.waitlistCount).toBe(3);
  });

  it('rejects joining twice and leaving when not waiting', () => {
    const state = applyJoinWaitlist(emptyState(), id, ctx);
    expect(codeOf(() => applyJoinWaitlist(state, id, ctx))).toBe('already_waitlisted');
    expect(codeOf(() => applyLeaveWaitlist(emptyState(), id))).toBe('not_waitlisted');
  });

  it('leaving removes the entry', () => {
    const state = applyLeaveWaitlist(applyJoinWaitlist(emptyState(), id, ctx), id);
    expect(state.bookings).toHaveLength(0);
  });

  it('a booking can not be cancelled through the waitlist and vice versa', () => {
    const waiting = applyJoinWaitlist(emptyState(), id, ctx);
    expect(codeOf(() => applyCancel(waiting, id, ctx))).toBe('not_booked');
  });
});

describe('waitlist promotion', () => {
  it('promotes the first waiting member when a booking is cancelled', () => {
    const t = template({ id: 't', baseBooked: 9, capacity: 10, baseWaitlist: 0 });
    // The member holds the last seat, 2 others queue behind a full class.
    const state = applyBook(emptyState(), sessionOn('t', day(1)), ctxAt(NOW, [t]));
    const queued = {
      ...state,
      adjustments: { [sessionOn('t', day(1))]: { booked: 0, waitlist: 2 } },
    };
    const after = applyCancel(queued, sessionOn('t', day(1)), ctxAt(NOW, [t]));
    const occ = occupancy(t, after, sessionOn('t', day(1)));
    expect(occ.booked).toBe(10); // the promoted member took the seat
    expect(occ.waitlist).toBe(1);
  });

  it('frees the seat when nobody is waiting', () => {
    const t = template({ id: 't', baseBooked: 9, capacity: 10 });
    const ctx = ctxAt(NOW, [t]);
    const id = sessionOn('t', day(1));
    const after = applyCancel(applyBook(emptyState(), id, ctx), id, ctx);
    expect(occupancy(t, after, id).booked).toBe(9);
  });

  it('settles the member waitlist after the simulated delay and confirms the booking', () => {
    const full = template({ id: 'full', baseBooked: 10, capacity: 10, baseWaitlist: 2 });
    const id = sessionOn('full', day(1));
    const joined = applyJoinWaitlist(emptyState(), id, ctxAt(NOW, [full]));

    const early = applySettleWaitlist(joined, ctxAt(new Date(NOW.getTime() + 1000), [full]));
    expect(early.promoted).toEqual([]);

    const later = new Date(NOW.getTime() + WAITLIST_PROMOTION_DELAY_MS + 1);
    const settled = applySettleWaitlist(joined, ctxAt(later, [full]));
    expect(settled.promoted).toEqual([id]);
    const view = toSessionView(
      full,
      trainer,
      resolveSession([full], id, later)!.timing,
      settled.state,
      later,
    );
    expect(view.slot).toBe('booked');
    expect(view.bookedCount).toBe(10); // someone else left, capacity is not exceeded
  });

  it('does not promote into an overlapping class or a class that already started', () => {
    const full = template({ id: 'full', startTime: '18:00', baseBooked: 10, capacity: 10 });
    const clash = template({ id: 'clash', startTime: '18:30', baseBooked: 1 });
    const id = sessionOn('full', day(1));
    const joined = applyJoinWaitlist(emptyState(), id, ctxAt(NOW, [full, clash]));
    const withClash = applyBook(joined, sessionOn('clash', day(1)), ctxAt(NOW, [full, clash]));
    const later = new Date(NOW.getTime() + WAITLIST_PROMOTION_DELAY_MS + 1);
    expect(applySettleWaitlist(withClash, ctxAt(later, [full, clash])).promoted).toEqual([]);

    const started = new Date(2026, 10, 19, 18, 5);
    expect(applySettleWaitlist(joined, ctxAt(started, [full, clash])).promoted).toEqual([]);
  });
});

describe('undo', () => {
  const full = template({ id: 'full', baseBooked: 9, capacity: 10, baseWaitlist: 1, dayOfWeek: 5 });
  const ctx = ctxAt(NOW, [full]);
  const id = sessionOn('full', day(2));

  it('undoing a booking removes it without touching seats', () => {
    const booked = applyBook(emptyState(), id, ctx);
    const undone = applyUndoBook(booked, id);
    expect(occupancy(full, undone, id).booked).toBe(9);
    expect(codeOf(() => applyUndoBook(undone, id))).toBe('not_booked');
  });

  it('undoing a cancellation restores the booking and reverts the promotion', () => {
    const booked = applyBook(emptyState(), id, ctx);
    const cancelled = applyCancel(booked, id, ctx);
    expect(occupancy(full, cancelled, id).waitlist).toBe(0);
    const restored = applyUndoCancel(cancelled, id, ctx);
    const occ = occupancy(full, restored, id);
    expect(occ.booked).toBe(10);
    expect(occ.waitlist).toBe(1);
    expect(restored.lastCancellation).toBeNull();
  });

  it('refuses to undo after the undo window or for another session', () => {
    const cancelled = applyCancel(applyBook(emptyState(), id, ctx), id, ctx);
    const late = ctxAt(new Date(NOW.getTime() + UNDO_WINDOW_MS + 1), [full]);
    expect(codeOf(() => applyUndoCancel(cancelled, id, late))).toBe('undo_unavailable');
    expect(codeOf(() => applyUndoCancel(cancelled, sessionOn('full', day(3)), ctx))).toBe(
      'undo_unavailable',
    );
  });

  it('refuses to undo a cancellation that would now overlap another booking', () => {
    const other = template({ id: 'other', startTime: '18:30', baseBooked: 1, dayOfWeek: 5 });
    const both = ctxAt(NOW, [full, other]);
    const cancelled = applyCancel(applyBook(emptyState(), id, both), id, both);
    const withOther = applyBook(cancelled, sessionOn('other', day(2)), both);
    expect(codeOf(() => applyUndoCancel(withOther, id, both))).toBe('overlap');
  });
});
