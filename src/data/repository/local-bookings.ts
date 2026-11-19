import { delay } from '@/lib/demo/delay';
import { FAST_MODE } from '@/lib/demo/fast-mode';

import {
  applyBook,
  applyCancel,
  applyJoinWaitlist,
  applyLeaveWaitlist,
  applySettleWaitlist,
  applyUndoBook,
  applyUndoCancel,
  BookingError,
  syncDemoBookings,
  toSessionView,
  type RuleContext,
} from '../rules/booking';
import { generateSessionTimings, resolveSession } from '../rules/sessions';
import type { BookingState, ClassSessionView, ClassTemplate, Trainer } from '../types';

import { emitBookingsChanged } from './events';
import type { BookingRepository, ClassRepository } from './interfaces';
import { readCollection, serial, writeCollection } from './local-core';

const QUICK = [0, 0] as const;
const WAITLIST_DELAY_FAST_MS = 5_000;

interface Loaded {
  templates: ClassTemplate[];
  trainers: Trainer[];
  state: BookingState;
  now: Date;
}

async function load(): Promise<Loaded> {
  const [templates, trainers, state] = await Promise.all([
    readCollection('classTemplates', QUICK),
    readCollection('trainers', QUICK),
    readCollection('bookingState', QUICK),
  ]);
  const now = new Date();
  return { templates, trainers, state: syncDemoBookings(state, { templates, now }), now };
}

const context = ({ templates, now }: Loaded): RuleContext => ({
  templates,
  now,
  waitlistDelayMs: FAST_MODE ? WAITLIST_DELAY_FAST_MS : undefined,
});

function viewOf(loaded: Loaded, state: BookingState, sessionId: string): ClassSessionView {
  const found = resolveSession(loaded.templates, sessionId, loaded.now);
  const trainer = found && loaded.trainers.find((t) => t.id === found.template.trainerId);
  if (!found || !trainer) throw new BookingError('not_found');
  return toSessionView(found.template, trainer, found.timing, state, loaded.now);
}

async function mutate(
  sessionId: string,
  rule: (state: BookingState, ctx: RuleContext) => BookingState,
): Promise<ClassSessionView> {
  await delay(250, 650);
  return serial(async () => {
    const loaded = await load();
    const next = rule(loaded.state, context(loaded));
    await writeCollection('bookingState', next, QUICK);
    emitBookingsChanged();
    return viewOf(loaded, next, sessionId);
  });
}

export const localClassRepository: ClassRepository = {
  async listSessions() {
    await delay();
    const loaded = await load();
    return generateSessionTimings(loaded.templates, loaded.now).map((timing) =>
      viewOf(loaded, loaded.state, timing.id),
    );
  },

  async getSession(sessionId) {
    await delay(200, 450);
    const loaded = await load();
    return viewOf(loaded, loaded.state, sessionId);
  },

  async listUpcomingBooked() {
    await delay();
    const loaded = await load();
    const nowMs = loaded.now.getTime();
    return loaded.state.bookings
      .filter((b) => b.status === 'booked' && Date.parse(b.startAt) > nowMs)
      .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))
      .map((b) => viewOf(loaded, loaded.state, b.sessionId));
  },
};

export const localBookingRepository: BookingRepository = {
  book: (id) => mutate(id, (state, ctx) => applyBook(state, id, ctx)),
  cancel: (id) => mutate(id, (state, ctx) => applyCancel(state, id, ctx)),
  joinWaitlist: (id) => mutate(id, (state, ctx) => applyJoinWaitlist(state, id, ctx)),
  leaveWaitlist: (id) => mutate(id, (state) => applyLeaveWaitlist(state, id)),
  undoBook: (id) => mutate(id, (state) => applyUndoBook(state, id)),
  undoCancel: (id) => mutate(id, (state, ctx) => applyUndoCancel(state, id, ctx)),

  settleWaitlist() {
    return serial(async () => {
      const loaded = await load();
      const { state, promoted } = applySettleWaitlist(loaded.state, context(loaded));
      if (promoted.length === 0) return [];
      await writeCollection('bookingState', state, QUICK);
      emitBookingsChanged();
      return promoted.map((id) => viewOf(loaded, state, id));
    });
  },
};
