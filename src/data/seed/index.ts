import type {
  Achievement,
  BodyEntry,
  Exercise,
  GymClass,
  Member,
  Membership,
  MembershipPlan,
  PersonalRecord,
  SessionState,
  Trainer,
  WorkoutLogEntry,
  WorkoutPlan,
} from '../types';

import { classes } from './classes';
import { exercises } from './exercises';
import { buildMember, initialSession } from './member';
import { buildMembership, membershipPlans, workoutPlans } from './plans';
import { achievements, buildBodyEntries, buildPersonalRecords, buildWorkoutLog } from './progress';
import { trainers } from './trainers';

export interface SeedData {
  session: SessionState;
  member: Member;
  trainers: Trainer[];
  classes: GymClass[];
  exercises: Exercise[];
  workoutPlans: WorkoutPlan[];
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
    classes,
    exercises,
    workoutPlans,
    membershipPlans,
    membership: buildMembership(now),
    bodyEntries: buildBodyEntries(now),
    personalRecords: buildPersonalRecords(now),
    achievements,
    workoutLog: buildWorkoutLog(now, workoutPlans),
  };
}
