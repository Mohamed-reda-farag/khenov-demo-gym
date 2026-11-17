import { describe, expect, it } from 'vitest';

import {
  applyBook,
  applyCancel,
  applyJoinWaitlist,
  applyLeaveWaitlist,
  toSessionView,
} from '@/data/rules/booking';
import { resolveSession } from '@/data/rules/sessions';
import { NOW, ctxAt, emptyState, sessionOn, template } from '@/data/rules/__tests__/fixtures';
import type { BookingState, ClassSessionView, Trainer } from '@/data/types';

import { optimisticView } from '../optimistic';

const trainer: Trainer = {
  id: 'trainer',
  name: { ar: 'م', en: 'C' },
  specialty: { ar: 'ق', en: 'S' },
  bio: { ar: 'ن', en: 'B' },
  yearsExperience: 4,
};

const SUMMARY_KEYS = [
  'slot',
  'bookedCount',
  'spotsLeft',
  'waitlistCount',
  'waitlistPosition',
] as const;

function summary(view: ClassSessionView) {
  return Object.fromEntries(SUMMARY_KEYS.map((k) => [k, view[k]]));
}

/** The optimistic guess must match what the real rules produce, or the UI would flicker. */
describe('optimisticView matches the repository rules', () => {
  const open = template({ id: 'open', baseBooked: 4, capacity: 10 });
  const full = template({
    id: 'full',
    baseBooked: 10,
    capacity: 10,
    baseWaitlist: 2,
    startTime: '20:00',
  });
  const ctx = ctxAt(NOW, [open, full]);
  const day = new Date(2026, 10, 19);

  const viewOf = (id: string, templateId: string, state: BookingState) => {
    const found = resolveSession(ctx.templates, id, NOW)!;
    const tpl = templateId === 'open' ? open : full;
    return toSessionView(tpl, trainer, found.timing, state, NOW);
  };

  it('book', () => {
    const id = sessionOn('open', day);
    const before = viewOf(id, 'open', emptyState());
    const after = viewOf(id, 'open', applyBook(emptyState(), id, ctx));
    expect(summary(optimisticView(before, 'book'))).toEqual(summary(after));
  });

  it('cancel with and without a waitlist', () => {
    const openId = sessionOn('open', day);
    const booked = applyBook(emptyState(), openId, ctx);
    expect(summary(optimisticView(viewOf(openId, 'open', booked), 'cancel'))).toEqual(
      summary(viewOf(openId, 'open', applyCancel(booked, openId, ctx))),
    );

    const lastSeat = template({ id: 'last', baseBooked: 9, capacity: 10, startTime: '21:00' });
    const lastCtx = ctxAt(NOW, [lastSeat]);
    const id = sessionOn('last', day);
    const state = applyBook(emptyState(), id, lastCtx);
    const queued: BookingState = {
      ...state,
      adjustments: { [id]: { booked: 0, waitlist: 2 } },
    };
    const found = resolveSession(lastCtx.templates, id, NOW)!;
    const before = toSessionView(lastSeat, trainer, found.timing, queued, NOW);
    const after = toSessionView(
      lastSeat,
      trainer,
      found.timing,
      applyCancel(queued, id, lastCtx),
      NOW,
    );
    expect(summary(optimisticView(before, 'cancel'))).toEqual(summary(after));
  });

  it('join and leave the waitlist', () => {
    const id = sessionOn('full', day);
    const before = viewOf(id, 'full', emptyState());
    const joined = applyJoinWaitlist(emptyState(), id, ctx);
    expect(summary(optimisticView(before, 'joinWaitlist'))).toEqual(
      summary(viewOf(id, 'full', joined)),
    );
    const waiting = viewOf(id, 'full', joined);
    expect(summary(optimisticView(waiting, 'leaveWaitlist'))).toEqual(
      summary(viewOf(id, 'full', applyLeaveWaitlist(joined, id))),
    );
  });
});
