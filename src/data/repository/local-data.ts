import type {
  ExerciseRepository,
  MemberRepository,
  MembershipRepository,
  ProgressRepository,
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

export const localProgressRepository: ProgressRepository = {
  listBodyEntries: () => readCollection('bodyEntries'),
  listPersonalRecords: () => readCollection('personalRecords'),
  listAchievements: () => readCollection('achievements'),
  listWorkoutLog: () => readCollection('workoutLog'),
};
