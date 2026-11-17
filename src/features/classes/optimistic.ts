import type { ClassSessionView } from '@/data/types';

export type BookingAction = 'book' | 'cancel' | 'joinWaitlist' | 'leaveWaitlist';

/**
 * What the repository is expected to return, computed locally so the UI can react instantly.
 * The real result always replaces this once the request settles.
 */
export function optimisticView(view: ClassSessionView, action: BookingAction): ClassSessionView {
  switch (action) {
    case 'book':
      return {
        ...view,
        slot: 'booked',
        bookedCount: view.bookedCount + 1,
        spotsLeft: Math.max(0, view.spotsLeft - 1),
        canCancel: Date.now() <= Date.parse(view.cancelDeadline),
      };
    case 'cancel': {
      // Someone waiting takes the freed seat, so a class with a waitlist stays full.
      const promoted = view.waitlistCount > 0;
      return {
        ...view,
        slot: promoted ? 'full' : 'open',
        bookedCount: promoted ? view.bookedCount : view.bookedCount - 1,
        spotsLeft: promoted ? 0 : view.spotsLeft + 1,
        waitlistCount: promoted ? view.waitlistCount - 1 : view.waitlistCount,
        canCancel: false,
      };
    }
    case 'joinWaitlist':
      return {
        ...view,
        slot: 'waitlisted',
        waitlistCount: view.waitlistCount + 1,
        waitlistPosition: view.waitlistCount + 1,
      };
    case 'leaveWaitlist':
      return {
        ...view,
        slot: 'full',
        waitlistCount: Math.max(0, view.waitlistCount - 1),
        waitlistPosition: null,
      };
  }
}
