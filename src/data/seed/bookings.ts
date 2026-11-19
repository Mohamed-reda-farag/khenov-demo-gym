import type { BookingState, ScheduleEntry } from '../types';

/**
 * The demo member starts booked into two classes on different weekdays, so they never overlap.
 * Their sessions are worked out at runtime (see `syncDemoBookings`), never fixed at seeding time.
 */
export function buildBookingState(): BookingState {
  return {
    bookings: [],
    demoSlots: [
      { templateId: 'class-core-express', status: 'active' },
      { templateId: 'class-spin-rush', status: 'active' },
    ],
    adjustments: {},
    lastCancellation: null,
  };
}

/** Training days of the active plan. Days not listed are rest days. */
export const workoutSchedule: ScheduleEntry[] = [
  { dayOfWeek: 6, planId: 'plan-upper-power' },
  { dayOfWeek: 1, planId: 'plan-lower-strength' },
  { dayOfWeek: 3, planId: 'plan-full-burn' },
  { dayOfWeek: 4, planId: 'plan-upper-power' },
];
