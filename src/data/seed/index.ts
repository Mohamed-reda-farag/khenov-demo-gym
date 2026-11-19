import type {
  BodyEntry,
  Exercise,
  BookingState,
  ClassTemplate,
  Member,
  Membership,
  MembershipPlan,
  ScheduleEntry,
  SessionState,
  Trainer,
  WorkoutPlan,
  WorkoutSession,
} from '../types';

import { evaluateAchievements } from '../rules/achievements';
import { buildBookingState, workoutSchedule } from './bookings';
import { classTemplates } from './classes';
import { exercises } from './exercises';
import { buildMember, initialSession } from './member';
import { buildMembership, membershipPlans, workoutPlans } from './plans';
import { generateSeedHistory } from './history';
import { buildBodyEntries } from './progress';
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
  /** Workouts the member did in this demo. The older history is generated at runtime. */
  userSessions: WorkoutSession[];
  unlockedAchievements: Record<string, string>;
}

function initialUnlocks(now: Date): Record<string, string> {
  const { newlyUnlocked } = evaluateAchievements(generateSeedHistory(now, workoutPlans), now, {});
  return Object.fromEntries(newlyUnlocked.map((id) => [id, now.toISOString()]));
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
    bookingState: buildBookingState(),
    membershipPlans,
    membership: buildMembership(now),
    bodyEntries: buildBodyEntries(now),
    userSessions: [],
    unlockedAchievements: initialUnlocks(now),
  };
}
