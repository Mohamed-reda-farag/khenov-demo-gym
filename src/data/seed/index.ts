import type {
  Achievement,
  BodyEntry,
  Exercise,
  BookingState,
  ClassTemplate,
  Member,
  Membership,
  MembershipPlan,
  PersonalRecord,
  ScheduleEntry,
  SessionState,
  Trainer,
  WorkoutLogEntry,
  WorkoutPlan,
} from '../types';

import { buildBookingState, workoutSchedule } from './bookings';
import { classTemplates } from './classes';
import { exercises } from './exercises';
import { buildMember, initialSession } from './member';
import { buildMembership, membershipPlans, workoutPlans } from './plans';
import { achievements, buildBodyEntries, buildPersonalRecords, buildWorkoutLog } from './progress';
import { trainers } from './trainers';

export interface SeedData {
  session: SessionState;
  member: Member;
  trainers: Trainer[];
  classTemplates: ClassTemplate[];
  exercises: Exercise[];
  workoutPlans: WorkoutPlan[];
  workoutSchedule: ScheduleEntry[];
  bookingState: BookingState;
  membershipPlans: MembershipPlan[];
  membership: Membership;
  bodyEntries: BodyEntry[];
  personalRecords: PersonalRecord[];
  achievements: Achievement[];
  workoutLog: WorkoutLogEntry[];
}

/** All fictional. Dates are computed from `now` so the demo always feels current. */
export function buildSeed(now: Date): SeedData {
  return {
    session: initialSession,
    member: buildMember(now),
    trainers,
    classTemplates,
    exercises,
    workoutPlans,
    workoutSchedule,
    bookingState: buildBookingState(now, classTemplates),
    membershipPlans,
    membership: buildMembership(now),
    bodyEntries: buildBodyEntries(now),
    personalRecords: buildPersonalRecords(now),
    achievements,
    workoutLog: buildWorkoutLog(now, workoutPlans),
  };
}
