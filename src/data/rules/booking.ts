import type {
  Booking,
  BookingState,
  ClassSessionView,
  ClassSlotState,
  ClassTemplate,
  SessionAdjustment,
  Trainer,
} from '../types';

import { resolveSession, type SessionTiming } from './sessions';

export const CANCEL_CUTOFF_MS = 2 * 60 * 60 * 1000;
export const UNDO_WINDOW_MS = 15_000;
export const WAITLIST_PROMOTION_DELAY_MS = 30_000;

export type BookingErrorCode =
  | 'not_found'
  | 'in_past'
  | 'already_booked'
  | 'already_waitlisted'
  | 'class_full'
  | 'class_not_full'
  | 'overlap'
  | 'not_booked'
  | 'not_waitlisted'
  | 'cutoff_passed'
  | 'undo_unavailable';

export class BookingError extends Error {
  readonly code: BookingErrorCode;
  /** Set for `overlap`: the session the member is already booked in. */
  readonly conflictSessionId: string | null;

  constructor(code: BookingErrorCode, conflictSessionId: string | null = null) {
    super(code);
    this.name = 'BookingError';
    this.code = code;
    this.conflictSessionId = conflictSessionId;
  }
}

export interface RuleContext {
  templates: ClassTemplate[];
  now: Date;
  /** Overrides how long a waitlisted booking waits before the simulated promotion. */
  waitlistDelayMs?: number | undefined;
}

export function emptyBookingState(): BookingState {
  return { bookings: [], adjustments: {}, lastCancellation: null };
}

const iso = (ms: number) => new Date(ms).toISOString();
const bookingId = (sessionId: string) => `booking-${sessionId}`;
const adjustmentOf = (state: BookingState, sessionId: string): SessionAdjustment =>
  state.adjustments[sessionId] ?? { booked: 0, waitlist: 0 };
const bookingFor = (state: BookingState, sessionId: string) =>
  state.bookings.find((b) => b.sessionId === sessionId);

export function occupancy(template: ClassTemplate, state: BookingState, sessionId: string) {
  const adj = adjustmentOf(state, sessionId);
  const mine = bookingFor(state, sessionId);
  const othersBooked = Math.max(0, template.baseBooked + adj.booked);
  const othersWaiting = Math.max(0, template.baseWaitlist + adj.waitlist);
  return {
    booked: othersBooked + (mine?.status === 'booked' ? 1 : 0),
    waitlist: othersWaiting + (mine?.status === 'waitlisted' ? 1 : 0),
    othersWaiting,
  };
}

function requireSession(ctx: RuleContext, sessionId: string) {
  const found = resolveSession(ctx.templates, sessionId, ctx.now);
  if (!found) throw new BookingError('not_found');
  return found;
}

function findOverlap(state: BookingState, timing: SessionTiming): string | null {
  const clash = state.bookings.find(
    (b) =>
      b.status === 'booked' &&
      b.sessionId !== timing.id &&
      Date.parse(b.startAt) < timing.endMs &&
      timing.startMs < Date.parse(b.endAt),
  );
  return clash ? clash.sessionId : null;
}

function newBooking(
  timing: SessionTiming,
  status: Booking['status'],
  now: Date,
  extra: Partial<Booking> = {},
): Booking {
  return {
    id: bookingId(timing.id),
    sessionId: timing.id,
    templateId: timing.templateId,
    startAt: iso(timing.startMs),
    endAt: iso(timing.endMs),
    status,
    createdAt: now.toISOString(),
    waitlistPosition: null,
    promotionDueAt: null,
    ...extra,
  };
}

function assertFuture(timing: SessionTiming, now: Date) {
  if (timing.startMs <= now.getTime()) throw new BookingError('in_past');
}

function assertNoDuplicate(state: BookingState, sessionId: string) {
  const mine = bookingFor(state, sessionId);
  if (mine)
    throw new BookingError(mine.status === 'booked' ? 'already_booked' : 'already_waitlisted');
}

export function applyBook(state: BookingState, sessionId: string, ctx: RuleContext): BookingState {
  const { template, timing } = requireSession(ctx, sessionId);
  assertFuture(timing, ctx.now);
  assertNoDuplicate(state, sessionId);
  const clash = findOverlap(state, timing);
  if (clash) throw new BookingError('overlap', clash);
  if (occupancy(template, state, sessionId).booked >= template.capacity) {
    throw new BookingError('class_full');
  }
  return { ...state, bookings: [...state.bookings, newBooking(timing, 'booked', ctx.now)] };
}

export function applyJoinWaitlist(
  state: BookingState,
  sessionId: string,
  ctx: RuleContext,
): BookingState {
  const { template, timing } = requireSession(ctx, sessionId);
  assertFuture(timing, ctx.now);
  assertNoDuplicate(state, sessionId);
  const occ = occupancy(template, state, sessionId);
  if (occ.booked < template.capacity) throw new BookingError('class_not_full');
  const clash = findOverlap(state, timing);
  if (clash) throw new BookingError('overlap', clash);
  const waiting = newBooking(timing, 'waitlisted', ctx.now, {
    waitlistPosition: occ.othersWaiting + 1,
    promotionDueAt: iso(ctx.now.getTime() + (ctx.waitlistDelayMs ?? WAITLIST_PROMOTION_DELAY_MS)),
  });
  return { ...state, bookings: [...state.bookings, waiting] };
}

/** Cancels a booking. The first waiting member (if any) takes the freed seat. */
export function applyCancel(
  state: BookingState,
  sessionId: string,
  ctx: RuleContext,
): BookingState {
  const { template, timing } = requireSession(ctx, sessionId);
  const mine = bookingFor(state, sessionId);
  if (!mine || mine.status !== 'booked') throw new BookingError('not_booked');
  assertFuture(timing, ctx.now);
  if (timing.startMs - ctx.now.getTime() < CANCEL_CUTOFF_MS)
    throw new BookingError('cutoff_passed');

  const before = adjustmentOf(state, sessionId);
  const after = { ...before };
  if (occupancy(template, state, sessionId).othersWaiting > 0) {
    after.waitlist -= 1;
    after.booked += 1;
  }
  return {
    bookings: state.bookings.filter((b) => b.sessionId !== sessionId),
    adjustments: { ...state.adjustments, [sessionId]: after },
    lastCancellation: {
      booking: mine,
      adjustmentBefore: before,
      expiresAt: iso(ctx.now.getTime() + UNDO_WINDOW_MS),
    },
  };
}

export function applyLeaveWaitlist(state: BookingState, sessionId: string): BookingState {
  const mine = bookingFor(state, sessionId);
  if (!mine || mine.status !== 'waitlisted') throw new BookingError('not_waitlisted');
  return { ...state, bookings: state.bookings.filter((b) => b.sessionId !== sessionId) };
}

/** Takes back a booking made moments ago. Skips the cancellation cutoff and leaves seats alone. */
export function applyUndoBook(state: BookingState, sessionId: string): BookingState {
  const mine = bookingFor(state, sessionId);
  if (!mine || mine.status !== 'booked') throw new BookingError('not_booked');
  return { ...state, bookings: state.bookings.filter((b) => b.sessionId !== sessionId) };
}

/** Restores a cancelled booking, including a waitlist promotion it caused. */
export function applyUndoCancel(
  state: BookingState,
  sessionId: string,
  ctx: RuleContext,
): BookingState {
  const last = state.lastCancellation;
  if (
    !last ||
    last.booking.sessionId !== sessionId ||
    ctx.now.getTime() > Date.parse(last.expiresAt)
  ) {
    throw new BookingError('undo_unavailable');
  }
  const { timing } = requireSession(ctx, sessionId);
  assertFuture(timing, ctx.now);
  const clash = findOverlap(state, timing);
  if (clash) throw new BookingError('overlap', clash);
  return {
    bookings: [...state.bookings, last.booking],
    adjustments: { ...state.adjustments, [sessionId]: last.adjustmentBefore },
    lastCancellation: null,
  };
}

/** Simulates other members cancelling: waitlisted bookings whose time came are promoted. */
export function applySettleWaitlist(
  state: BookingState,
  ctx: RuleContext,
): { state: BookingState; promoted: string[] } {
  let current = state;
  const promoted: string[] = [];

  for (const waiting of state.bookings) {
    if (waiting.status !== 'waitlisted' || !waiting.promotionDueAt) continue;
    if (Date.parse(waiting.promotionDueAt) > ctx.now.getTime()) continue;
    const found = resolveSession(ctx.templates, waiting.sessionId, ctx.now);
    if (!found || found.timing.startMs <= ctx.now.getTime()) continue;

    if (findOverlap(current, found.timing)) {
      current = {
        ...current,
        bookings: current.bookings.map((b) =>
          b.sessionId === waiting.sessionId ? { ...b, promotionDueAt: null } : b,
        ),
      };
      continue;
    }

    const adj = adjustmentOf(current, waiting.sessionId);
    const full =
      occupancy(found.template, current, waiting.sessionId).booked >= found.template.capacity;
    current = {
      ...current,
      adjustments: full
        ? { ...current.adjustments, [waiting.sessionId]: { ...adj, booked: adj.booked - 1 } }
        : current.adjustments,
      bookings: current.bookings.map((b) =>
        b.sessionId === waiting.sessionId
          ? { ...b, status: 'booked', waitlistPosition: null, promotionDueAt: null }
          : b,
      ),
    };
    promoted.push(waiting.sessionId);
  }
  return { state: current, promoted };
}

export function toSessionView(
  template: ClassTemplate,
  trainer: Trainer,
  timing: SessionTiming,
  state: BookingState,
  now: Date,
): ClassSessionView {
  const mine = bookingFor(state, timing.id);
  const occ = occupancy(template, state, timing.id);
  const nowMs = now.getTime();
  const deadlineMs = timing.startMs - CANCEL_CUTOFF_MS;

  let slot: ClassSlotState;
  if (timing.startMs <= nowMs) slot = 'ended';
  else if (mine?.status === 'booked') slot = 'booked';
  else if (mine?.status === 'waitlisted') slot = 'waitlisted';
  else slot = occ.booked >= template.capacity ? 'full' : 'open';

  return {
    id: timing.id,
    templateId: template.id,
    name: template.name,
    description: template.description,
    requirements: template.requirements,
    trainer,
    room: template.room,
    level: template.level,
    category: template.category,
    durationMin: template.durationMin,
    startAt: iso(timing.startMs),
    endAt: iso(timing.endMs),
    capacity: template.capacity,
    bookedCount: occ.booked,
    spotsLeft: Math.max(0, template.capacity - occ.booked),
    waitlistCount: occ.waitlist,
    slot,
    waitlistPosition: mine?.status === 'waitlisted' ? mine.waitlistPosition : null,
    canCancel: mine?.status === 'booked' && nowMs <= deadlineMs,
    cancelDeadline: iso(deadlineMs),
  };
}
