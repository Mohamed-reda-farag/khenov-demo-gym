import { emptyBookingState } from '../rules/booking';
import { generateSessionTimings } from '../rules/sessions';
import type { BookingState, ClassTemplate, ScheduleEntry } from '../types';

/** Two upcoming classes on different weekdays, so they can never overlap. */
const SEEDED_TEMPLATE_IDS = ['class-core-express', 'class-spin-rush'];

export function buildBookingState(now: Date, templates: ClassTemplate[]): BookingState {
  const state = emptyBookingState();
  const timings = generateSessionTimings(templates, now);
  for (const templateId of SEEDED_TEMPLATE_IDS) {
    const next = timings.find((t) => t.templateId === templateId && t.startMs > now.getTime());
    if (!next) continue;
    state.bookings.push({
      id: `booking-${next.id}`,
      sessionId: next.id,
      templateId,
      startAt: new Date(next.startMs).toISOString(),
      endAt: new Date(next.endMs).toISOString(),
      status: 'booked',
      createdAt: now.toISOString(),
      waitlistPosition: null,
      promotionDueAt: null,
    });
  }
  return state;
}

/** Training days of the active plan. Days not listed are rest days. */
export const workoutSchedule: ScheduleEntry[] = [
  { dayOfWeek: 6, planId: 'plan-upper-power' },
  { dayOfWeek: 1, planId: 'plan-lower-strength' },
  { dayOfWeek: 3, planId: 'plan-full-burn' },
  { dayOfWeek: 4, planId: 'plan-upper-power' },
];
