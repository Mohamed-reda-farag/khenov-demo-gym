import type { BookingState, ClassTemplate } from '../../types';
import { emptyBookingState, type RuleContext } from '../booking';
import { dateKey, makeSessionId, weekStartSaturday } from '../sessions';

const text = { ar: 'نص', en: 'Text' };

export function template(overrides: Partial<ClassTemplate> = {}): ClassTemplate {
  return {
    id: 't1',
    name: text,
    trainerId: 'trainer',
    dayOfWeek: 4,
    startTime: '18:00',
    durationMin: 60,
    capacity: 10,
    baseBooked: 4,
    baseWaitlist: 0,
    level: 'beginner',
    category: 'strength',
    room: text,
    description: text,
    requirements: [],
    ...overrides,
  };
}

/** Templates default to Thursday (day offset +1 from NOW). Wednesday 2026-11-18 at 12:00 local time. */
export const NOW = new Date(2026, 10, 18, 12, 0);

export function ctxAt(now: Date, templates: ClassTemplate[]): RuleContext {
  return { templates, now };
}

/** Session id of `templateId` on the given local day. */
export function sessionOn(templateId: string, day: Date): string {
  return makeSessionId(templateId, dateKey(day));
}

export const emptyState = (): BookingState => emptyBookingState();

export { weekStartSaturday };
