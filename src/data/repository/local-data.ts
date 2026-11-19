import type {
  ExerciseRepository,
  MemberRepository,
  MembershipRepository,
  TrainerRepository,
  WorkoutPlanRepository,
} from './interfaces';
import { readCollection } from './local-core';

export const localMemberRepository: MemberRepository = {
  get: () => readCollection('member'),
};

export const localTrainerRepository: TrainerRepository = {
  list: () => readCollection('trainers'),
};

export const localExerciseRepository: ExerciseRepository = {
  list: () => readCollection('exercises'),
};

export const localWorkoutPlanRepository: WorkoutPlanRepository = {
  list: () => readCollection('workoutPlans'),
  getSchedule: () => readCollection('workoutSchedule'),
  async getForToday(now = new Date()) {
    const [schedule, plans] = await Promise.all([
      readCollection('workoutSchedule'),
      readCollection('workoutPlans'),
    ]);
    const entry = schedule.find((e) => e.dayOfWeek === now.getDay());
    return plans.find((p) => p.id === entry?.planId) ?? null;
  },
};

export const localMembershipRepository: MembershipRepository = {
  listPlans: () => readCollection('membershipPlans'),
  getCurrent: () => readCollection('membership'),
};
